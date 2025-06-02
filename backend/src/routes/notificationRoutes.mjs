// /Users/patrick/Projects/Teralynk/backend/src/routes/notificationRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Notifications route is working!" });
});

export default router;
