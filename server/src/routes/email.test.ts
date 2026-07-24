import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import emailRouter from './email.js';

function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, () => resolve(server));
  });
}

function makeRequest(server, method, path, options = {}) {
  const port = server.address().port;
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port, path, method, headers: { 'Content-Type': 'application/json', ...options.headers } },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, body, text: body.toString() });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

describe('email routes', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  it('POST /send with missing subject returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/send', {
      body: { to: 'user@example.com', body: 'Hello' },
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid input/i);
  });

  it('POST /send with missing body returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/send', {
      body: { to: 'user@example.com', subject: 'Hello' },
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid input/i);
  });

  it('POST /send with invalid email returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/send', {
      body: { to: 'not-an-email', subject: 'Hello', body: 'World' },
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/valid email/i);
  });

  it('POST /send with non-string to returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/send', {
      body: { to: 12345, subject: 'Hello', body: 'World' },
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/valid email/i);
  });

  it('POST /draft with missing transcript returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/draft', {
      body: {},
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toBe('transcript is required');
  });

  it('POST /draft without apiKey returns 400', async () => {
    server = await createTestServer(emailRouter);
    const res = await makeRequest(server, 'POST', '/draft', {
      body: { transcript: 'We discussed the project timeline.' },
    });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/api key/i);
  });
});
