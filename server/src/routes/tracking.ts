import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';

const router = express.Router();

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

const openSchema = z.object({
  uid: z.string().max(128).optional()
});

router.get('/open/:campaignId', validateRequest({ query: openSchema }), (req, res) => {
  const { campaignId } = req.params;
  const { uid } = req.query as { uid?: string };

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

const clickSchema = z.object({
  url: z.string().url().optional(),
  uid: z.string().max(128).optional()
});

router.get('/click/:campaignId', validateRequest({ query: clickSchema }), (req, res) => {
  const { campaignId } = req.params;
  const { url, uid } = req.query as { url?: string, uid?: string };

  if (uid && uid.length <= 128) {
    storeEvent(uid, {
      campaignId,
      event: 'click',
      url: url || '',
      timestamp: new Date().toISOString(),
    });
  }

  res.redirect(url || `${config.clientUrl}/meetings`);
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

export default router;
