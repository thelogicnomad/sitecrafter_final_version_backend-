import OpenAI from "openai";

export async function chatCompletionWithRetry(
  client: OpenAI,
  params: Parameters<OpenAI["chat"]["completions"]["create"]>[0],
  maxRetries = 3
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat.completions.create(params);
    } catch (err: any) {
      // Only retry on 429 (rate-limit) or 503 (service unavailable)
      const retryable = err?.status === 429 || err?.status === 503;
      if (!retryable || attempt === maxRetries) throw err;
      const backoff = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.warn(`OpenAI error ${err.status}. Retry ${attempt + 1}/${maxRetries} in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}
