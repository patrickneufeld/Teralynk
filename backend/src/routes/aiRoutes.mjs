import express from "express";
const router = express.Router();
router.get("/test", (req, res) => res.json({ msg: "test" }));
export default router;
