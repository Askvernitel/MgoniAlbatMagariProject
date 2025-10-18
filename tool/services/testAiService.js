import AiService from "./AiService.js";

async function runTest() {
  const ai = new AiService();
  const context = [
    { role: "user", parts: [{ text: "Hello, who are you?" }] },
    { role: "model", parts: [{ text: "I am Gemini, your AI assistant." }] },
  ];
  try {
    const reply = await ai.sendPrompt("What can you do?", context);
    console.log("Gemini reply:", reply);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

runTest();
