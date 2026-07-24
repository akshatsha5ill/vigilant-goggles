import { describe, it, expect, vi, beforeEach } from 'vitest';
import sanitize from './sanitize.js';

describe('sanitize middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {};
    next = vi.fn();
  });

  it('strips HTML tags from strings in body', () => {
    req = { body: { name: '<script>alert("xss")</script>Hello' } };

    sanitize(req, res, next);

    expect(req.body.name).toBe('alert("xss")Hello');
    expect(next).toHaveBeenCalled();
  });

  it('handles nested objects by stripping HTML recursively', () => {
    req = {
      body: {
        user: {
          name: '<b>Bold</b>',
          bio: '<i>Italic</i>',
        },
      },
    };

    sanitize(req, res, next);

    expect(req.body.user.name).toBe('Bold');
    expect(req.body.user.bio).toBe('Italic');
  });

  it('handles arrays by mapping stripHtml over each element', () => {
    req = {
      body: {
        tags: ['<p>First</p>', '<span>Second</span>', 'Clean'],
      },
    };

    sanitize(req, res, next);

    expect(req.body.tags).toEqual(['First', 'Second', 'Clean']);
  });

  it('passes through non-string values unchanged', () => {
    req = {
      body: {
        count: 42,
        active: true,
        nested: null,
      },
    };

    sanitize(req, res, next);

    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.nested).toBeNull();
  });

  it('calls next even when body is missing', () => {
    req = {};

    sanitize(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('calls next when body is not an object', () => {
    req = { body: 'just a string' };

    sanitize(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toBe('just a string');
  });
});
