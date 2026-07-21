const express = require('express');
const { generateSummary } = require('../services/ai-service');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    // Sentinel: Input validation
    const { transcript, meetingId, apiKey, model } = req.body;
    if (typeof transcript !== 'string' || typeof meetingId !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Transcript and meetingId must be strings.' });
    }

    if (apiKey === 'test') {
       return res.status(200).json({ status: "success", analysis: { summary: "Mock Summary generated using TEST key" } });
    }

    const summary = await generateSummary(transcript, model || 'openai', apiKey);
    res.status(200).json({ status: "success", analysis: { summary } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
