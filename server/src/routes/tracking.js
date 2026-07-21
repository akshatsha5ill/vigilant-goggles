const express = require('express');
const router = express.Router();

// In-memory tracking inbox (ephemeral, cleared after dashboard pulls)
const trackingInbox = [];

// Tracking pixel endpoint (image response)
router.get('/open/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  trackingInbox.push({
    campaignId,
    event: 'open',
    timestamp: new Date().toISOString(),
  });

  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length });
  res.end(pixel);
});

// Click redirect endpoint
router.get('/click/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { url } = req.query;

  trackingInbox.push({
    campaignId,
    event: 'click',
    url: url || '',
    timestamp: new Date().toISOString(),
  });

  // Redirect to the target URL or dashboard
  res.redirect(url || `${process.env.CLIENT_URL || 'http://localhost:5173'}/meetings`);
});

// Pull tracking events (called by dashboard)
router.get('/events', (req, res) => {
  const events = [...trackingInbox];
  trackingInbox.length = 0; // Clear after pull
  res.status(200).json({ status: 'success', events });
});

// Get events for specific campaign
router.get('/events/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const events = trackingInbox.filter((e) => e.campaignId === campaignId);
  res.status(200).json({ status: 'success', events });
});

module.exports = router;
