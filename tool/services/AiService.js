import fetch from "node-fetch";

const GEMINI_API_KEY = "AIzaSyDLPr1UnemxlGlC91bmOrb9esqM4zcxCrg";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  // Changed from /v1/models to /v1beta/models ^^^

class AiService {
  context;
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

  async analyzeRepositoryChanges(gitService, commitA, commitB, isAnalyze= false) {
    const files = await gitService.getTrackedFiles();
    const summaries = [];
    let cumulativeContext = [];

    console.log(`Analyzing ${files.length} files between commits...`);
    if(isAnalyze){
    summaries.push(
        await gitService.getCommitTree()
    )
  }
    // Analyze each file sequentially
    for (const file of files) {
      try {
        const diffResult = await gitService.getFileDiffBetweenCommits(file, commitA, commitB);
        
        // Handle different return formats from gitService
        const diff = typeof diffResult === 'string' ? diffResult : diffResult?.diff || '';
        
        if (!diff || diff.trim() === "") {
          console.log(`Skipping ${file} (no changes)`);
          continue;
        }

        console.log(`Analyzing: ${file}`);

        // Create prompt for individual file analysis
        const filePrompt = `Analyze the following git diff for file "${file}":

${diff}

Provide a concise summary (2-3 sentences) of:
1. What changed in this file
2. The purpose/impact of these changes`;

        // Get summary for this file with previous context
        const summary = await this.sendPrompt(filePrompt, cumulativeContext);
        if(isAnalyze) {
          filePrompt+="IMPORTANT I Gave you tree please analyze the structure and make suggestions what can do";
        }
        summaries.push({
          file,
          summary: summary.trim()
        });

        // Add this file's summary to context for next iteration
        cumulativeContext.push(
          { role: "user", parts: [{ text: `File: ${file}` }] },
          { role: "model", parts: [{ text: summary }] }
        );

        console.log(`✓ Completed: ${file}`);
      } catch (error) {
        console.error(`Error analyzing ${file}:`, error.message);
        summaries.push({
          file,
          summary: `Error: ${error.message}`
        });
      }
    }

    // Generate overall analysis
    console.log("\nGenerating overall analysis...");
    
    const overallPrompt = `Based on all the file changes analyzed above, provide a comprehensive summary of:

1. **Overall Purpose**: What is the main goal of these changes across all files?
2. **Key Changes**: What are the most significant modifications?
3. **Impact**: How do these changes affect the codebase?
4. **Architecture**: Are there any architectural or structural changes?

Keep the summary clear and concise (4-6 sentences).`;

    const overallAnalysis = await this.sendPrompt(overallPrompt, cumulativeContext);

    return {
      commitRange: { from: commitA, to: commitB },
      filesAnalyzed: summaries.length,
      fileSummaries: summaries,
      overallAnalysis: overallAnalysis.trim()
    };
  }
}

export default AiService;