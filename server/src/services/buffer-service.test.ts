import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Buffer Service', () => {
  let bufferService;

  beforeEach(() => {
    vi.resetModules();
    bufferService = require('../services/buffer-service');
    bufferService.buffer.clear();
  });

  it('should store and retrieve data', () => {
    bufferService.store('test-key', { value: 'hello' });
    const result = bufferService.get('test-key');
    expect(result).toEqual({ value: 'hello' });
  });

  it('should return null for non-existent keys', () => {
    const result = bufferService.get('non-existent');
    expect(result).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    vi.useFakeTimers();
    bufferService.store('expire-key', { value: 'temp' });
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    const result = bufferService.get('expire-key');
    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it('should overwrite existing entries', () => {
    bufferService.store('key', { v: 1 });
    bufferService.store('key', { v: 2 });
    const result = bufferService.get('key');
    expect(result).toEqual({ v: 2 });
  });
});
