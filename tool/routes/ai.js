import express from "express";
import GitService from "../services/GitService.js"
import AiService from "../services/AiService.js";
import zlib from 'zlib';
const aiRouter = express.Router();
let repo = '/home/danieludzlieresi/Desktop/badgit';
const gitService= new GitService(repo);
const aiService = new AiService()
aiRouter.post("/ai/commit", (req, res, next) => {


  res.json({ message: "not implemented" });
});

aiRouter.get("/commit/tree", async (req, res)=>{ 
  res.send(await gitService.getCommitTree());
}
)
//we dont care about REST rn
aiRouter.post("/repo", (req,res)=>{
  repo = req.body.repo;
});

aiRouter.get("/ai/branches", (req, res, next) => {
  // Return all git branches
  res.json({ message: "not implemented" });
});

aiRouter.get("/ai/compare", async (req, res, next) => {
  let hash1= req.query.hash1;
  let hash2= req.query.hash2;
  if (!hash1 || !hash2) {
    return res.status(400).json({ error: "Both hashes are required." });
  }

  hash1 = hash1.replace(/['"]+/g, '').trim();
  hash2 = hash2.replace(/['"]+/g, '').trim();
  //console.log(await gitService.analyzeCommits(hash1, hash2))
  let ans = await aiService.sendPrompt(zlib.gzipSync(JSON.stringify(await gitService.analyzeCommits(hash1, hash2)))).toString("base64");
  console.log(ans);
  res.json({ hash1, hash2, message: "Comparison logic not implemented yet." });
});

export default aiRouter;
