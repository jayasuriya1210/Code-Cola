async function callLLM({ system, user, responseFormat = "text", maxTokens = 500 }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || (process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");
  const model = process.env.OPENAI_MODEL || (process.env.GROQ_API_KEY ? "llama-3.1-8b-instant" : "gpt-4o-mini");

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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
