const express = require('express');
const router = express.Router();
const bufferService = require('../services/buffer-service');

// Zoom OAuth callback
router.get('/oauth/callback', (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  // In production: exchange code for access token via Zoom API
  // For now, redirect to the client dashboard
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/meetings?zoom=connected`);
});

// Zoom webhook handler
router.post('/webhook', (req, res) => {
  const { event, payload } = req.body;

  if (event === 'meeting.started') {
    const meetingId = payload?.object?.id;
    if (meetingId) {
      bufferService.store(`meeting:${meetingId}`, { startedAt: new Date().toISOString(), status: 'active' });
    }
  }

  if (event === 'meeting.ended') {
    const meetingId = payload?.object?.id;
    if (meetingId) {
      const data = bufferService.get(`meeting:${meetingId}`);
      if (data) {
        data.endedAt = new Date().toISOString();
        data.status = 'completed';
        bufferService.store(`meeting:${meetingId}`, data);
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

// Store transcription data in buffer (called by Zoom RTMS or caption relay)
router.post('/transcription', (req, res) => {
  const { meetingId, segment } = req.body;
  if (!meetingId || !segment) {
    return res.status(400).json({ error: 'meetingId and segment are required' });
  }

  const key = `transcript:${meetingId}`;
  const existing = bufferService.get(key) || { segments: [] };
  existing.segments.push(segment);
  bufferService.store(key, existing);

  // Broadcast to connected WebSocket clients
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting:${meetingId}`).emit('transcription', segment);
  }

  res.status(200).json({ status: 'ok' });
});

// Store quick notes from Zoom panel
router.post('/notes', (req, res) => {
  const { meetingId, note } = req.body;
  if (!meetingId || !note) {
    return res.status(400).json({ error: 'meetingId and note are required' });
  }

  const key = `notes:${meetingId}`;
  const existing = bufferService.get(key) || { notes: [] };
  existing.notes.push({ ...note, receivedAt: new Date().toISOString() });
  bufferService.store(key, existing);

  res.status(200).json({ status: 'ok' });
});

// Pull buffered data for a meeting (called by dashboard on connect)
router.get('/buffer/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  const transcript = bufferService.get(`transcript:${meetingId}`);
  const notes = bufferService.get(`notes:${meetingId}`);
  const meetingData = bufferService.get(`meeting:${meetingId}`);

  res.status(200).json({
    transcript: transcript || null,
    notes: notes || null,
    meeting: meetingData || null,
  });
});

// Clear buffer after dashboard has pulled data
router.delete('/buffer/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  bufferService.buffer.delete(`transcript:${meetingId}`);
  bufferService.buffer.delete(`notes:${meetingId}`);
  bufferService.buffer.delete(`meeting:${meetingId}`);
  res.status(200).json({ status: 'cleared' });
});

module.exports = router;
