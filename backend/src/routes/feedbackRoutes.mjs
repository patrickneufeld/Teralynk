// /Users/patrick/Projects/Teralynk/backend/src/routes/feedbackRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Feedback route is working!" });
});

export default router;
