const express = require('express');
const { sendDraft } = require('../services/email-service');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    // Sentinel: Input validation
    const { to, subject, body } = req.body;
    if (typeof subject !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Subject and body must be strings.' });
    }

    // Sentinel: Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof to !== 'string' || !emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid input. A valid email address is required.' });
    }

    const data = await sendDraft(to, subject, body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
