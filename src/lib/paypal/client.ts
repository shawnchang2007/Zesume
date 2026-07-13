import {
  getPayPalApiBase,
  getPayPalCredentials,
  getPayPalEnvironment,
} from "./config";

type TokenCache = {
  environment: string;
  clientId: string;
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export class PayPalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly debugId?: string,
  ) {
    super(message);
  }
}

async function getAccessToken() {
  const { clientId, clientSecret } = getPayPalCredentials();
  const environment = getPayPalEnvironment();
  const now = Date.now();

  if (
    tokenCache &&
    tokenCache.environment === environment &&
    tokenCache.clientId === clientId &&
    tokenCache.expiresAt > now + 60_000
  ) {
    return tokenCache.accessToken;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({})) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!response.ok || !payload.access_token) {
      throw new PayPalApiError("PayPal authentication failed.", response.status);
    }

    tokenCache = {
      environment,
      clientId,
      accessToken: payload.access_token,
      expiresAt: now + Math.max(60, payload.expires_in ?? 300) * 1_000,
    };
    return payload.access_token;
  } finally {
    clearTimeout(timeout);
  }
}

export async function paypalRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    requestId?: string;
  } = {},
) {
  const accessToken = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${getPayPalApiBase()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.requestId ? { "PayPal-Request-Id": options.requestId } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({})) as T & {
      message?: string;
      debug_id?: string;
    };

    if (!response.ok) {
      throw new PayPalApiError(
        payload.message || "PayPal request failed.",
        response.status,
        payload.debug_id,
      );
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

