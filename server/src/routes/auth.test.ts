import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import authRouter from './auth.js';

function createTestServer(router, envSetup) {
  const app = express();
  app.use(express.json());
  app.use(router);
  if (envSetup) envSetup();
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, () => resolve(server));
  });
}

function makeRequest(server, method, path, options = {}) {
  const port = server.address().port;
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port, path, method, headers: options.headers || {} },
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

describe('auth routes', () => {
  let server;
  const originalEnv = process.env.NODE_ENV;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
    process.env.NODE_ENV = originalEnv;
  });

  it('GET /auth/health returns 200', async () => {
    server = await createTestServer(authRouter);
    const res = await makeRequest(server, 'GET', '/health');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.message).toBe('Auth service healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('POST /auth/dev-token in production returns 404', async () => {
    process.env.NODE_ENV = 'production';
    server = await createTestServer(authRouter);
    const res = await makeRequest(server, 'POST', '/dev-token');
    expect(res.status).toBe(404);
    const body = JSON.parse(res.text);
    expect(body.error).toBe('Not available in production');
  });

  it('POST /auth/dev-token in non-production returns 200', async () => {
    process.env.NODE_ENV = 'development';
    server = await createTestServer(authRouter);
    const res = await makeRequest(server, 'POST', '/dev-token');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.status).toBe('success');
  });
});
