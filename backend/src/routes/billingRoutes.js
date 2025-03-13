// /Users/patrick/Projects/Teralynk/backend/src/routes/billingRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Billing route is working!" });
});

export default router;
