import express from "express";
import GitService from "../services/GitService.js"
const aiRouter = express.Router();
let repo = '/home/danieludzlieresi/Desktop/badgit';
const gitService= new GitService(repo);
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

aiRouter.post("/ai/compare", (req, res, next) => {
  let hash1= req.query.hash1;
  let hash2= req.query.hash2;
  if (!hash1 || !hash2) {
    return res.status(400).json({ error: "Both hashes are required." });
  }
  res.json({ hash1, hash2, message: "Comparison logic not implemented yet." });
});

export default aiRouter;
