const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');
const bufferService = require('../services/buffer-service');
const { verifyAuth } = require('../middleware/auth');

// Zoom OAuth callback — exchange code for tokens
router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/zoom/oauth/callback`;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Zoom OAuth not configured' });
  }

  try {
    const tokenRes = await new Promise((resolve, reject) => {
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString();

      const req = https.request('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Failed to parse token response')); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (tokenRes.error) {
      return res.status(400).json({ error: tokenRes.reason || tokenRes.error });
    }

    res.json({
      status: 'success',
      expires_in: tokenRes.expires_in,
    });
  } catch (err) {
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Zoom webhook handler
router.post('/webhook', (req, res) => {
  const { event, payload } = req.body;

  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
     return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify signature
  const zoomSignature = req.headers['x-zm-signature'];
  const zoomTimestamp = req.headers['x-zm-request-timestamp'];

  if (!zoomSignature || !zoomTimestamp) {
    return res.status(401).json({ error: 'Unauthorized: Missing signature' });
  }

  const message = `v0:${zoomTimestamp}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const signature = `v0=${hashForVerify}`;

  const bufSig = Buffer.from(signature);
  const bufZoom = Buffer.from(zoomSignature);

  if (bufSig.length !== bufZoom.length || !crypto.timingSafeEqual(bufSig, bufZoom)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
  }

  // Zoom webhook validation
  if (event === 'endpoint.url_validation') {
    const hashForValidate = crypto.createHmac('sha256', secret).update(payload.plainToken).digest('hex');
    return res.status(200).json({
      plainToken: payload.plainToken,
      encryptedToken: hashForValidate
    });
  }

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

// Store transcription data in buffer (called by Zoom RTMS or caption relay) — auth required
router.post('/transcription', verifyAuth, (req, res) => {
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

// Store quick notes from Zoom panel — auth required
router.post('/notes', verifyAuth, (req, res) => {
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
router.get('/buffer/:meetingId', verifyAuth, (req, res) => {
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

// Clear buffer after dashboard has pulled data — auth required
router.delete('/buffer/:meetingId', verifyAuth, (req, res) => {
  const { meetingId } = req.params;
  bufferService.buffer.delete(`transcript:${meetingId}`);
  bufferService.buffer.delete(`notes:${meetingId}`);
  bufferService.buffer.delete(`meeting:${meetingId}`);
  res.status(200).json({ status: 'cleared' });
});

module.exports = router;
