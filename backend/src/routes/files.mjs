import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// 🔐 Protect all file routes
router.use(requireAuth);

// ✅ Example endpoint
router.get('/', (req, res) => {
  res.json({ message: 'File route working!' });
});

export default router;
