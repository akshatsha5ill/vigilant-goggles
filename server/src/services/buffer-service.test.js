import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We import the module dynamically to ensure we get a fresh instance if needed,
// but require() caches it anyway. Let's just import it directly since it exports an instance.
import bufferService from './buffer-service';

describe('BufferService', () => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    // Clear the internal buffer before each test
    bufferService.buffer.clear();
    // Enable fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  describe('store and get basic functionality', () => {
    it('should store and retrieve data correctly', () => {
      const key = 'meeting_123';
      const data = { transcript: 'Hello world' };

      bufferService.store(key, data);

      const retrieved = bufferService.get(key);
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = bufferService.get('non_existent_key');
      expect(retrieved).toBeNull();
    });
  });

  describe('TTL and _cleanup logic', () => {
    it('should return null if getting a key that has expired', () => {
      const key = 'meeting_123';
      const data = { transcript: 'Hello world' };

      bufferService.store(key, data);

      // Advance time by 24 hours + 1 millisecond
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS + 1);

      const retrieved = bufferService.get(key);

      // Since it's expired, get() should return null and delete it
      expect(retrieved).toBeNull();
      expect(bufferService.buffer.has(key)).toBe(false);
    });

    it('should evict expired entries during store() via _cleanup', () => {
      const oldKey = 'meeting_old';
      const oldData = { transcript: 'Old meeting' };

      bufferService.store(oldKey, oldData);

      // Advance time by 24 hours + 1 millisecond
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS + 1);

      // Verify it's still in the internal map because _cleanup hasn't run yet
      expect(bufferService.buffer.has(oldKey)).toBe(true);

      const newKey = 'meeting_new';
      const newData = { transcript: 'New meeting' };

      // This store() call should trigger _cleanup()
      bufferService.store(newKey, newData);

      // The old key should now be evicted
      expect(bufferService.buffer.has(oldKey)).toBe(false);
      // The new key should be present
      expect(bufferService.buffer.has(newKey)).toBe(true);
      expect(bufferService.get(newKey)).toEqual(newData);
    });

    it('should not evict entries before TTL expires', () => {
      const key = 'meeting_123';
      const data = { transcript: 'Hello world' };

      bufferService.store(key, data);

      // Advance time by 23 hours
      vi.advanceTimersByTime(23 * 60 * 60 * 1000);

      // This store() call triggers _cleanup()
      bufferService.store('dummy_key', {});

      // The original key should NOT be evicted
      expect(bufferService.buffer.has(key)).toBe(true);
      expect(bufferService.get(key)).toEqual(data);
    });
  });
});
