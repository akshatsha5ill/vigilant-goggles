const express = require('express');
const { generateSummary, generateActionItems, analyzeSentiment } = require('../services/ai-service');
const router = express.Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { transcript, meetingId, apiKey, model } = req.body;
    if (typeof transcript !== 'string' || typeof meetingId !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Transcript and meetingId must be strings.' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required. Configure your AI API keys in Settings.' });
    }

    const effectiveModel = model || 'openai';
    const [summary, actionItems, sentiment] = await Promise.all([
      generateSummary(transcript, effectiveModel, apiKey),
      generateActionItems(transcript, effectiveModel, apiKey),
      analyzeSentiment(transcript, effectiveModel, apiKey),
    ]);

    res.status(200).json({
      status: "success",
      analysis: { summary, actionItems, sentiment }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
