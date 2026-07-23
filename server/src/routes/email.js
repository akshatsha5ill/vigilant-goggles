const express = require('express');
const { sendDraft } = require('../services/email-service');
const router = express.Router();

router.post('/send', async (req, res, next) => {
  try {
    const { to, subject, body } = req.body;
    if (typeof subject !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Subject and body must be strings.' });
    }

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

// AI email draft generation
router.post('/draft', async (req, res, next) => {
  try {
    const { transcript, leadContext, apiKey, model } = req.body;
    if (typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required. Configure your AI API keys in Settings.' });
    }

    const OpenAI = require('openai');
    const { Anthropic } = require('@anthropic-ai/sdk');
    const effectiveModel = model || 'openai';
    const aiModels = {
      openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    };

    const leadInfo = leadContext ? `\nLead: ${leadContext.name} (${leadContext.role}) at ${leadContext.company}` : '';
    const prompt = `Write a professional follow-up email based on this meeting transcript:${leadInfo}\n\nTranscript:\n${transcript}\n\nReturn ONLY a JSON object with "subject" and "body" (HTML) fields.`;

    let raw;
    if (effectiveModel === 'openai') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: aiModels.openai,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = response.choices[0].message.content;
    } else {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: aiModels.anthropic,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = response.content[0].text;
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const draft = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: 'Follow-up', body: raw };
    res.status(200).json({ status: 'success', draft });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
