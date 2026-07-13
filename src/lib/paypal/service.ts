import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  formatUsd,
  getPayPalEnvironment,
  PAYPAL_PRODUCTS,
  PAYPAL_WEBHOOK_EVENTS,
  type PurchasablePlan,
} from "./config";
import { PayPalApiError, paypalRequest } from "./client";
import {
  amountToCents,
  getApprovalUrl,
  getCompletedCapture,
  getWebhookCaptureId,
  getWebhookOrderId,
  type PayPalOrder,
  type PayPalWebhookEvent,
} from "./types";

const PROVIDER = "paypal-one-time";

type WebhookList = {
  webhooks?: Array<{ id?: string; url?: string }>;
};

type WebhookRecord = {
  id?: string;
  url?: string;
};

export class CheckoutError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 500,
  ) {
    super(message);
  }
}

function addAccessDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1_000);
}

function providerName() {
  return `${PROVIDER}:${getPayPalEnvironment()}`;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function ensurePayPalWebhook(baseUrl: string) {
  const environment = getPayPalEnvironment();
  const webhookUrl = `${baseUrl}/api/billing/paypal/webhook`;
  const configuredId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const existingConfig = await prisma.billingProviderConfig.findUnique({
    where: { provider_environment: { provider: PROVIDER, environment } },
  });

  if (configuredId) {
    await prisma.billingProviderConfig.upsert({
      where: { provider_environment: { provider: PROVIDER, environment } },
      create: { provider: PROVIDER, environment, webhookId: configuredId, webhookUrl },
      update: { webhookId: configuredId, webhookUrl },
    });
    return configuredId;
  }

  if (existingConfig?.webhookUrl === webhookUrl) return existingConfig.webhookId;

  const list = await paypalRequest<WebhookList>("/v1/notifications/webhooks");
  let webhook = list.webhooks?.find((item) => item.url === webhookUrl);

  if (!webhook?.id) {
    webhook = await paypalRequest<WebhookRecord>("/v1/notifications/webhooks", {
      method: "POST",
      requestId: `zesume-webhook-${environment}`,
      body: {
        url: webhookUrl,
        event_types: PAYPAL_WEBHOOK_EVENTS.map((name) => ({ name })),
      },
    });
  }

  if (!webhook.id) throw new CheckoutError("WEBHOOK_SETUP_FAILED", "PayPal webhook setup failed.");

  await prisma.billingProviderConfig.upsert({
    where: { provider_environment: { provider: PROVIDER, environment } },
    create: { provider: PROVIDER, environment, webhookId: webhook.id, webhookUrl },
    update: { webhookId: webhook.id, webhookUrl },
  });
  return webhook.id;
}

export async function createPayPalCheckout(
  userId: string,
  plan: PurchasablePlan,
  baseUrl: string,
) {
  const product = PAYPAL_PRODUCTS[plan];
  const now = new Date();

  if (plan === "PLUS") {
    const activePro = await prisma.subscription.findFirst({
      where: {
        userId,
        plan: "PRO",
        status: { in: ["ACTIVE", "TRIALING"] },
        AND: [
          { OR: [{ currentPeriodStart: null }, { currentPeriodStart: { lte: now } }] },
          { OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }] },
        ],
      },
      select: { id: true },
    });
    if (activePro) {
      throw new CheckoutError(
        "HIGHER_PLAN_ACTIVE",
        "Your Pro access is already active. Extend Pro instead of purchasing Plus.",
        409,
      );
    }
  }

  await ensurePayPalWebhook(baseUrl);

  const paymentRecord = await prisma.subscription.create({
    data: {
      userId,
      plan,
      status: "INCOMPLETE",
      provider: providerName(),
      amountCents: product.amountCents,
      currency: product.currency,
    },
  });

  try {
    const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      requestId: `zesume-order-${paymentRecord.id}`,
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: paymentRecord.id,
            custom_id: paymentRecord.id,
            description: `${product.name} - ${product.accessDays} days of access`,
            amount: {
              currency_code: product.currency,
              value: formatUsd(product.amountCents),
            },
          },
        ],
        application_context: {
          brand_name: "Zesume",
          landing_page: "LOGIN",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${baseUrl}/api/billing/paypal/return`,
          cancel_url: `${baseUrl}/pricing?payment=cancelled`,
        },
      },
    });
    const approvalUrl = getApprovalUrl(order);
    if (!order.id || !approvalUrl) {
      throw new CheckoutError("ORDER_CREATION_FAILED", "PayPal did not return a checkout URL.");
    }

    await prisma.subscription.update({
      where: { id: paymentRecord.id },
      data: { providerSubscriptionId: order.id },
    });

    return { approvalUrl, orderId: order.id };
  } catch (error) {
    await prisma.subscription.delete({ where: { id: paymentRecord.id } }).catch(() => undefined);
    throw error;
  }
}

function validateCompletedOrder(
  order: PayPalOrder,
  paymentRecord: {
    id: string;
    providerSubscriptionId: string | null;
    amountCents: number | null;
    currency: string | null;
  },
) {
  const unit = order.purchase_units?.[0];
  const capture = getCompletedCapture(order);
  const orderCents = amountToCents(unit?.amount?.value);
  const captureCents = amountToCents(capture?.amount?.value);

  if (
    !order.id ||
    order.id !== paymentRecord.providerSubscriptionId ||
    order.status !== "COMPLETED" ||
    unit?.reference_id !== paymentRecord.id ||
    unit.custom_id !== paymentRecord.id ||
    !capture?.id ||
    orderCents !== paymentRecord.amountCents ||
    captureCents !== paymentRecord.amountCents ||
    unit.amount?.currency_code !== paymentRecord.currency ||
    capture.amount?.currency_code !== paymentRecord.currency
  ) {
    throw new CheckoutError("PAYMENT_MISMATCH", "PayPal payment details did not match this purchase.", 409);
  }

  return capture.id;
}

async function activateCompletedOrder(order: PayPalOrder, expectedUserId?: string) {
  const paymentRecord = await prisma.subscription.findFirst({
    where: { provider: providerName(), providerSubscriptionId: order.id },
  });
  if (!paymentRecord || (expectedUserId && paymentRecord.userId !== expectedUserId)) {
    throw new CheckoutError("ORDER_NOT_FOUND", "This PayPal order does not belong to the signed-in user.", 404);
  }
  if (paymentRecord.status === "ACTIVE" && paymentRecord.providerPaymentId) {
    return paymentRecord;
  }

  const captureId = validateCompletedOrder(order, paymentRecord);
  const product = paymentRecord.plan === "PLUS" || paymentRecord.plan === "PRO"
    ? PAYPAL_PRODUCTS[paymentRecord.plan]
    : null;
  if (!product) throw new CheckoutError("INVALID_PLAN", "This order has an invalid plan.", 409);

  return prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findUnique({ where: { id: paymentRecord.id } });
    if (!current) throw new CheckoutError("ORDER_NOT_FOUND", "Payment record was not found.", 404);
    if (current.status === "ACTIVE" && current.providerPaymentId) return current;

    const latestSamePlan = await tx.subscription.findFirst({
      where: {
        id: { not: current.id },
        userId: current.userId,
        plan: current.plan,
        status: { in: ["ACTIVE", "TRIALING"] },
        currentPeriodEnd: { gt: new Date() },
      },
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true },
    });
    const now = new Date();
    const periodStart = latestSamePlan?.currentPeriodEnd && latestSamePlan.currentPeriodEnd > now
      ? latestSamePlan.currentPeriodEnd
      : now;
    const periodEnd = addAccessDays(periodStart, product.accessDays);
    const updated = await tx.subscription.updateMany({
      where: {
        id: current.id,
        providerPaymentId: null,
        status: { in: ["INCOMPLETE", "PAST_DUE"] },
      },
      data: {
        status: "ACTIVE",
        providerPaymentId: captureId,
        providerCustomerId: order.payer?.payer_id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
      },
    });

    if (updated.count === 0) {
      const alreadyUpdated = await tx.subscription.findUnique({ where: { id: current.id } });
      if (alreadyUpdated?.providerPaymentId === captureId) return alreadyUpdated;
      throw new CheckoutError("PAYMENT_ALREADY_USED", "This PayPal payment was already processed.", 409);
    }

    return tx.subscription.findUniqueOrThrow({ where: { id: current.id } });
  }, { maxWait: 10_000, timeout: 20_000 });
}

export async function capturePayPalOrder(orderId: string, expectedUserId?: string) {
  const paymentRecord = await prisma.subscription.findFirst({
    where: { provider: providerName(), providerSubscriptionId: orderId },
  });
  if (!paymentRecord || (expectedUserId && paymentRecord.userId !== expectedUserId)) {
    throw new CheckoutError("ORDER_NOT_FOUND", "This PayPal order was not found.", 404);
  }
  if (paymentRecord.status === "ACTIVE" && paymentRecord.providerPaymentId) return paymentRecord;

  let order: PayPalOrder;
  try {
    order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      requestId: `zesume-capture-${orderId}`,
    });
  } catch (error) {
    if (!(error instanceof PayPalApiError) || error.status !== 422) throw error;
    order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  }

  return activateCompletedOrder(order, expectedUserId);
}

async function confirmPayPalOrder(orderId: string) {
  const order = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  return activateCompletedOrder(order);
}

async function updatePaymentStatus(event: PayPalWebhookEvent, status: "PAST_DUE" | "CANCELED") {
  const orderId = getWebhookOrderId(event);
  const captureId = getWebhookCaptureId(event);
  const where = orderId
    ? { providerSubscriptionId: orderId }
    : captureId
      ? { providerPaymentId: captureId }
      : null;
  if (!where) return;

  await prisma.subscription.updateMany({
    where: { provider: providerName(), ...where },
    data: { status },
  });
}

async function revokeRefundedPayment(event: PayPalWebhookEvent) {
  const captureId = getWebhookCaptureId(event);
  if (!captureId) return;
  const paymentRecord = await prisma.subscription.findFirst({
    where: { provider: providerName(), providerPaymentId: captureId },
  });
  if (!paymentRecord) return;

  const refundedCents = amountToCents(event.resource?.amount?.value);
  const refundedCurrency = event.resource?.amount?.currency_code;
  if (
    refundedCents !== null &&
    paymentRecord.amountCents !== null &&
    (refundedCents < paymentRecord.amountCents || refundedCurrency !== paymentRecord.currency)
  ) {
    return;
  }

  await prisma.subscription.update({
    where: { id: paymentRecord.id },
    data: { status: "CANCELED", currentPeriodEnd: new Date() },
  });
}

export async function getPayPalWebhookId() {
  const configured = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (configured) return configured;
  const config = await prisma.billingProviderConfig.findUnique({
    where: {
      provider_environment: {
        provider: PROVIDER,
        environment: getPayPalEnvironment(),
      },
    },
    select: { webhookId: true },
  });
  return config?.webhookId ?? null;
}

export async function verifyPayPalWebhook(request: Request, event: PayPalWebhookEvent) {
  const webhookId = await getPayPalWebhookId();
  const authAlgo = request.headers.get("paypal-auth-algo");
  const certUrl = request.headers.get("paypal-cert-url");
  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  if (!webhookId || !authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }

  const result = await paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      },
    },
  );
  return result.verification_status === "SUCCESS";
}

export async function processPayPalWebhook(event: PayPalWebhookEvent) {
  if (!event.id || !event.event_type) {
    throw new CheckoutError("INVALID_WEBHOOK", "PayPal webhook is missing required fields.", 400);
  }
  const processed = await prisma.billingWebhookEvent.findUnique({ where: { id: event.id } });
  if (processed) return { duplicate: true };

  switch (event.event_type) {
    case "CHECKOUT.ORDER.APPROVED": {
      const orderId = getWebhookOrderId(event);
      if (orderId) await capturePayPalOrder(orderId);
      break;
    }
    case "PAYMENT.CAPTURE.COMPLETED": {
      const orderId = getWebhookOrderId(event);
      if (orderId) await confirmPayPalOrder(orderId);
      break;
    }
    case "PAYMENT.CAPTURE.PENDING":
      await updatePaymentStatus(event, "PAST_DUE");
      break;
    case "PAYMENT.CAPTURE.DECLINED":
    case "CHECKOUT.PAYMENT-APPROVAL.REVERSED":
      await updatePaymentStatus(event, "CANCELED");
      break;
    case "PAYMENT.CAPTURE.REFUNDED":
      await revokeRefundedPayment(event);
      break;
    case "PAYMENT.CAPTURE.REVERSED":
      await updatePaymentStatus(event, "CANCELED");
      break;
  }

  try {
    await prisma.billingWebhookEvent.create({
      data: { id: event.id, provider: providerName(), eventType: event.event_type },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }
  return { duplicate: false };
}

