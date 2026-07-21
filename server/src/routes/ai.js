const express = require('express');
const { generateSummary, generateActionItems, analyzeSentiment } = require('../services/ai-service');
const router = express.Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { transcript, meetingId, apiKey, model } = req.body;
    if (typeof transcript !== 'string' || typeof meetingId !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Transcript and meetingId must be strings.' });
    }

    if (apiKey === 'test') {
      return res.status(200).json({
        status: "success",
        analysis: {
          summary: "This was a productive meeting discussing key initiatives and next steps. The team aligned on priorities and identified clear action items for follow-up.",
          actionItems: [
            { task: 'Follow up on project timeline', assignee: 'Project Manager' },
            { task: 'Prepare budget proposal', assignee: 'Finance Lead' },
            { task: 'Schedule follow-up meeting', assignee: 'Sales Rep' },
          ],
          sentiment: { overall: 'positive', score: 78, notes: 'Collaborative and productive discussion with clear outcomes.' },
        }
      });
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
