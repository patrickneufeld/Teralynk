// /Users/patrick/Projects/Teralynk/backend/src/routes/developerRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Developers route is working!" });
});

export default router;
