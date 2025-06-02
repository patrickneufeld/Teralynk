import express from 'express';
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'AI File Naming Route Active' }));
export default router;
