import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const firebaseAdminPath = resolve(__dirname, '../services/firebase-admin.js');
const cachedAdmin = require(firebaseAdminPath);

let originalAuth;
let mockAuthFn;
let mockVerifyIdToken;

describe('verifyAuth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyIdToken = vi.fn();
    mockAuthFn = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));

    originalAuth = cachedAdmin.auth;
    cachedAdmin.auth = mockAuthFn;

    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    cachedAdmin.auth = originalAuth;
  });

  it('returns 401 when authorization header is missing', async () => {
    const { verifyAuth } = await import('./auth.js');
    await verifyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token format is invalid (no Bearer prefix)', async () => {
    req.headers.authorization = 'InvalidToken123';
    const { verifyAuth } = await import('./auth.js');

    await verifyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', async () => {
    req.headers.authorization = 'Bearer badtoken';
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
    const { verifyAuth } = await import('./auth.js');

    await verifyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for a valid token', async () => {
    const decoded = { uid: 'user123', email: 'test@example.com' };
    req.headers.authorization = 'Bearer validtoken';
    mockVerifyIdToken.mockResolvedValue(decoded);
    const { verifyAuth } = await import('./auth.js');

    await verifyAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(decoded);
    expect(res.status).not.toHaveBeenCalled();
  });
});
