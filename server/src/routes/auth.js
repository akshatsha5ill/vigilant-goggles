const express = require('express');
const router = express.Router();

// Health check for auth service
router.get('/health', (req, res) => {
  res.status(200).json({ message: 'Auth service healthy', timestamp: new Date().toISOString() });
});

// Dev-only: bypass auth for local testing (disabled in production)
router.post('/dev-token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  res.status(200).json({
    status: 'success',
    message: 'Use Firebase Auth SDK on the client for real authentication',
  });
});

module.exports = router;
