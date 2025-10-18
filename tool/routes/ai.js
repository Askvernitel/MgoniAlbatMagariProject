import express from "express";

const aiRouter = express.Router();
const gitService= new GitService();
aiRouter.post("/ai/commit", (req, res, next) => {



  res.json({ message: "not implemented" });
});

aiRouter.get("/ai/branches", (req, res, next) => {
  // Return all git branches
  res.json({ message: "not implemented" });
});

aiRouter.post("/ai/compare/:hash1/:hash2", (req, res, next) => {
  const { hash1, hash2 } = req.params;
  if (!hash1 || !hash2) {
    return res.status(400).json({ error: "Both hashes are required." });
  }
  res.json({ hash1, hash2, message: "Comparison logic not implemented yet." });
});

export default aiRouter;
