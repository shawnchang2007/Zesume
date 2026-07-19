import { describe, expect, it, vi } from "vitest";

import { fetchWithAiRetry } from "@/lib/ai/fetch-with-timeout";

function asFetch(
  implementation: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) {
  return vi.fn(implementation) as unknown as typeof fetch;
}

describe("AI provider retry policy", () => {
  it("returns a successful first response without retrying", async () => {
    const fetchImpl = asFetch(async () => Response.json({ ok: true }));

    const result = await fetchWithAiRetry("https://provider.test", undefined, {
      fetchImpl,
      sleep: async () => undefined,
      timeoutMs: 5_000,
    });

    expect(result.response.status).toBe(200);
    expect(result.attempts).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries one transient provider failure", async () => {
    const fetchImpl = asFetch(
      vi.fn()
        .mockResolvedValueOnce(new Response("busy", { status: 503 }))
        .mockResolvedValueOnce(Response.json({ ok: true })),
    );

    const result = await fetchWithAiRetry("https://provider.test", undefined, {
      fetchImpl,
      sleep: async () => undefined,
      random: () => 0,
      timeoutMs: 5_000,
    });

    expect(result.response.status).toBe(200);
    expect(result.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("caps Retry-After before retrying a rate limit", async () => {
    const delays: number[] = [];
    const fetchImpl = asFetch(
      vi.fn()
        .mockResolvedValueOnce(
          new Response("busy", {
            status: 429,
            headers: { "Retry-After": "30" },
          }),
        )
        .mockResolvedValueOnce(Response.json({ ok: true })),
    );

    const result = await fetchWithAiRetry("https://provider.test", undefined, {
      fetchImpl,
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
      timeoutMs: 5_000,
    });

    expect(result.attempts).toBe(2);
    expect(delays).toEqual([2_000]);
  });

  it("does not retry a non-transient client error", async () => {
    const fetchImpl = asFetch(async () => new Response("bad", { status: 400 }));

    const result = await fetchWithAiRetry("https://provider.test", undefined, {
      fetchImpl,
      sleep: async () => undefined,
      timeoutMs: 5_000,
    });

    expect(result.response.status).toBe(400);
    expect(result.attempts).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("recovers from a short network interruption", async () => {
    const fetchImpl = asFetch(
      vi.fn()
        .mockRejectedValueOnce(new TypeError("network unavailable"))
        .mockResolvedValueOnce(Response.json({ ok: true })),
    );

    const result = await fetchWithAiRetry("https://provider.test", undefined, {
      fetchImpl,
      sleep: async () => undefined,
      random: () => 0,
      timeoutMs: 5_000,
    });

    expect(result.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not start another attempt after the total timeout", async () => {
    const fetchImpl = asFetch(async (_input, init) => {
      await new Promise<void>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
      return Response.json({ ok: true });
    });

    await expect(
      fetchWithAiRetry("https://provider.test", undefined, {
        fetchImpl,
        maxAttempts: 2,
        timeoutMs: 10,
      }),
    ).rejects.toThrow("AI_TIMEOUT");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
