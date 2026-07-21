import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './client';

// Mock the firebase config so we don't try to connect to real firebase
vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock global fetch
global.fetch = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleResponse', () => {
    it('returns parsed json on success', async () => {
      const mockData = { id: 1, name: 'Test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: { 'Content-Type': 'application/json' }
      });
    });

    it('throws error with API response message on HTTP error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid input data' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid input data');
    });

    it('throws error with status text if API response message is missing or fails to parse', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        // Mock json() rejecting to simulate non-JSON error response (e.g. 500 HTML page)
        json: async () => { throw new Error('Not JSON'); },
      });

      // The code in handleResponse does:
      // const error = await response.json().catch(() => ({ error: response.statusText }));
      // throw new Error(error.error || `API error: ${response.statusText}`);
      //
      // Because error.error will be `response.statusText`,
      // the error message will be `response.statusText` ('Internal Server Error'),
      // not `API error: Internal Server Error`.
      await expect(apiClient.get('/test')).rejects.toThrow('Internal Server Error');
    });
  });
});
