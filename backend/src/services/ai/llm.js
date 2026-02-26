async function callLLM({ system, user, responseFormat = "text", maxTokens = 500 }) {
  const baseUrl = process.env.OPENAI_BASE_URL || (process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");
  const model = process.env.OPENAI_MODEL || (process.env.GROQ_API_KEY ? "llama-3.1-8b-instant" : "gpt-4o-mini");
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || "";
  const isLocalOllama = /localhost:11434|127\.0\.0\.1:11434/.test(baseUrl);

  if (!apiKey && !isLocalOllama) return null;

  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
  };

  if (responseFormat === "json" && !process.env.GROQ_API_KEY) {
    body.response_format = { type: "json_object" };
  }

  const headers = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`LLM request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || null;
  if (!content) return null;

  if (responseFormat === "json") {
    try {
      JSON.parse(content);
      return content;
    } catch (_err) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return match[0];
    }
  }

  return content;
}

module.exports = { callLLM };
