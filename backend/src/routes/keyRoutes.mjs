// /Users/patrick/Projects/Teralynk/backend/src/routes/keyRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Keys route is working!" });
});

export default router;
