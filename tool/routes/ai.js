import express from "express";
import GitService from "../services/GitService.js"
import AiService from "../services/AiService.js";
import zlib from 'zlib';

const aiRouter = express.Router();
let repo = '/home/danieludzlieresi/Desktop/badgit';
const gitService = new GitService(repo);
const aiService = new AiService();

aiRouter.post("/ai/commit", (req, res, next) => {
  res.json({ message: "not implemented" });
});

aiRouter.get("/commit/tree", async (req, res) => { 
  res.send(await gitService.getCommitTree());
});

//we dont care about REST rn
aiRouter.post("/repo", (req, res) => {
  repo = req.body.repo;
  res.json({ message: "Repository updated" });
});

aiRouter.get("/ai/branches", (req, res, next) => {
  // Return all git branches
  res.json({ message: "not implemented" });
});

aiRouter.get("/ai/compare", async (req, res, next) => {
  try {
    let hash1 = req.query.hash1;
    let hash2 = req.query.hash2;
    
    if (!hash1 || !hash2) {
      return res.status(400).json({ error: "Both hashes are required." });
    }
    
    // Sanitize hashes first
    hash1 = hash1.replace(/['"]+/g, '').trim();
    hash2 = hash2.replace(/['"]+/g, '').trim();
    
    console.log(`Analyzing commits: ${hash1} -> ${hash2}`);
    // Perform the analysis
    const analysis = await aiService.analyzeRepositoryChanges(gitService, hash1, hash2);
    
    console.log("Analysis complete:");
    console.log(JSON.stringify(analysis, null, 2));
    
    // Return the analysis
    res.json({
      success: true,
      commitRange: analysis.commitRange,
      filesAnalyzed: analysis.filesAnalyzed,
      fileSummaries: analysis.fileSummaries,
      overallAnalysis: analysis.overallAnalysis
    });
    
  } catch (error) {
    console.error("Error in /ai/compare:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default aiRouter;