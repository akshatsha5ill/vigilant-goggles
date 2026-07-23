const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');

const trackingInbox = new Map();
const MAX_EVENTS_PER_USER = 500;
const INBOX_TTL = 24 * 60 * 60 * 1000;
const inboxTimestamps = new Map();

const storeEvent = (userId, event) => {
  if (!userId) return;
  if (!trackingInbox.has(userId)) trackingInbox.set(userId, []);
  const events = trackingInbox.get(userId);
  events.push(event);
  if (events.length > MAX_EVENTS_PER_USER) {
    events.splice(0, events.length - MAX_EVENTS_PER_USER);
  }
  inboxTimestamps.set(userId, Date.now());
};

const cleanupInbox = () => {
  const now = Date.now();
  for (const [userId, timestamp] of inboxTimestamps.entries()) {
    if (now - timestamp > INBOX_TTL) {
      trackingInbox.delete(userId);
      inboxTimestamps.delete(userId);
    }
  }
};
setInterval(cleanupInbox, 60 * 60 * 1000);

router.get('/open/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { uid } = req.query;

  if (!uid || uid.length > 128) {
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length });
    return res.end(pixel);
  }

  storeEvent(uid, {
    campaignId,
    event: 'open',
    timestamp: new Date().toISOString(),
  });

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length });
  res.end(pixel);
});

router.get('/click/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { url, uid } = req.query;

  if (uid && uid.length <= 128) {
    storeEvent(uid, {
      campaignId,
      event: 'click',
      url: url || '',
      timestamp: new Date().toISOString(),
    });
  }

  res.redirect(url || `${process.env.CLIENT_URL || 'http://localhost:5173'}/meetings`);
});

// Pull tracking events for authenticated user
router.get('/events', verifyAuth, (req, res) => {
  const userId = req.user.uid;
  const events = trackingInbox.get(userId) || [];
  trackingInbox.delete(userId);
  res.status(200).json({ status: 'success', events });
});

// Get events for specific campaign (authenticated user only)
router.get('/events/:campaignId', verifyAuth, (req, res) => {
  const userId = req.user.uid;
  const { campaignId } = req.params;
  const allEvents = trackingInbox.get(userId) || [];
  const events = allEvents.filter((e) => e.campaignId === campaignId);
  res.status(200).json({ status: 'success', events });
});

module.exports = router;
