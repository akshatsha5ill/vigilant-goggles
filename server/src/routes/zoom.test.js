import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import http from 'http';

describe('Zoom Routes', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  it('should return 400 if no code is provided', async () => {
    const app = express();
    app.use(express.json());
    const zoomRoutes = require('./zoom');
    app.use('/api/zoom', zoomRoutes);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`http://localhost:${port}/api/zoom/oauth/callback`, { signal: controller.signal });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Missing authorization code');
    } finally {
      clearTimeout(timeout);
    }
  }, 10000);

  it('should return 500 if webhook secret is not configured', async () => {
    delete process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
    const app = express();
    app.use(express.json());
    const zoomRoutes = require('./zoom');
    app.use('/api/zoom', zoomRoutes);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/zoom/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'meeting.started', payload: {} }),
    });
    expect(res.status).toBe(500);
  });

  it('should return 401 if signature headers are missing', async () => {
    process.env.ZOOM_WEBHOOK_SECRET_TOKEN = 'test-secret';
    const app = express();
    app.use(express.json());
    const zoomRoutes = require('./zoom');
    app.use('/api/zoom', zoomRoutes);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/zoom/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'meeting.started', payload: {} }),
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for transcription without auth', async () => {
    const app = express();
    app.use(express.json());
    const zoomRoutes = require('./zoom');
    app.use('/api/zoom', zoomRoutes);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/zoom/transcription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: '123', segment: { text: 'hello' } }),
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for notes without auth', async () => {
    const app = express();
    app.use(express.json());
    const zoomRoutes = require('./zoom');
    app.use('/api/zoom', zoomRoutes);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/zoom/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: '123', note: { text: 'test' } }),
    });
    expect(res.status).toBe(401);
  });
});
