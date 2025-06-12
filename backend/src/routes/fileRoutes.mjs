// /Users/patrick/Projects/Teralynk/backend/src/routes/fileRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Files route is working!" });
});

export default router;
