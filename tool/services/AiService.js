import fetch from "node-fetch";

const GEMINI_API_KEY = "AIzaSyDLPr1UnemxlGlC91bmOrb9esqM4zcxCrg";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

class AiService {
  constructor(apiKey = GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  async sendPrompt(prompt, context = []) {
    const messages = [...context, { role: "user", parts: [{ text: prompt }] }];

    const body = JSON.stringify({ contents: messages });

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

export default AiService;
