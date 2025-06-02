// ✅ FILE: /backend/src/api/verifyRecaptcha.mjs
// Endpoint to verify Google reCAPTCHA v3 tokens

import express from 'express';
import axios from 'axios';

const router = express.Router();

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '6LfywVIrAAAAAH8GMJw7N5CYdPUhDra-V74DBTsT'; // 🔐 move to env in prod

router.post('/api/verify-recaptcha', async (req, res) => {
  const { token, action } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid reCAPTCHA token' });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const result = response.data;

    if (!result.success || result.score < 0.5 || (action && result.action !== action)) {
      return res.status(403).json({
        success: false,
        message: 'reCAPTCHA verification failed',
        score: result.score,
        action: result.action
      });
    }

    return res.status(200).json({ success: true, score: result.score, action: result.action });
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return res.status(500).json({ success: false, message: 'reCAPTCHA verification error' });
  }
});

export default router;
