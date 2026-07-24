import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import requestId from './requestId.js';

vi.spyOn(crypto, 'randomUUID');

describe('requestId middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = { setHeader: vi.fn() };
    next = vi.fn();
    crypto.randomUUID.mockReturnValue('mock-uuid-1234');
  });

  it('assigns a generated UUID when no X-Request-Id header is present', () => {
    requestId(req, res, next);

    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(req.requestId).toBe('mock-uuid-1234');
    expect(next).toHaveBeenCalled();
  });

  it('uses existing X-Request-Id header when provided', () => {
    req.headers['x-request-id'] = 'client-provided-id';

    requestId(req, res, next);

    expect(crypto.randomUUID).not.toHaveBeenCalled();
    expect(req.requestId).toBe('client-provided-id');
  });

  it('sets X-Request-Id response header', () => {
    req.headers['x-request-id'] = 'my-request-id';

    requestId(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'my-request-id');
  });

  it('calls next() to pass control to the next middleware', () => {
    requestId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
