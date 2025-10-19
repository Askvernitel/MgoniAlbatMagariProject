import fetch from "node-fetch";

const GEMINI_API_KEY = "AIzaSyDLPr1UnemxlGlC91bmOrb9esqM4zcxCrg";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

class AiService {
  constructor(apiKey = GEMINI_API_KEY) {
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
    this.apiKey = apiKey;
  }

  async sendPrompt(prompt, context = []) {
    const normalize = (msg) => {
      if (msg.parts) return msg;
      if (msg.text) return { role: msg.role || "user", parts: [{ text: msg.text }] };
      return { role: "user", parts: [{ text: String(msg) }] };
    };

    const messages = [...context.map(normalize), { role: "user", parts: [{ text: prompt }] }];

    const body = JSON.stringify({ contents: messages });

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Gemini API error: ${JSON.stringify(data, null, 2)}`);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

export default AiService;
