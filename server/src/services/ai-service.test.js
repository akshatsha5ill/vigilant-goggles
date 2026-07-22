import { describe, it, expect, vi, afterEach } from 'vitest';
import { getClient, generateSummary, generateActionItems, analyzeSentiment } from './ai-service';
import nock from 'nock';

describe('ai-service', () => {
  afterEach(() => {
    nock.cleanAll();
  });
  describe('getClient', () => {
    it('should return an OpenAI client when model is openai', () => {
      const { provider } = getClient('openai', 'test-key');
      expect(provider).toBe('openai');
    });

    it('should return an Anthropic client when model is anthropic', () => {
      const { provider } = getClient('anthropic', 'test-key');
      expect(provider).toBe('anthropic');
    });

    it('should throw an error for an unsupported model', () => {
      expect(() => getClient('unsupported-model', 'test-key')).toThrowError('Unsupported AI model');
    });
  });

  describe('generateSummary', () => {
    it('should call OpenAI API correctly', async () => {
      nock('http://localhost')
        .post('/chat/completions')
        .reply(200, {
          choices: [{ message: { content: 'Mock OpenAI Response' } }]
        });

      const summary = await generateSummary('test transcript', 'openai', 'test-key');
      expect(summary).toBe('Mock OpenAI Response');
    });

    it('should call Anthropic API correctly', async () => {
      nock('http://localhost')
        .post('/v1/messages')
        .reply(200, {
          content: [{ text: 'Mock Anthropic Response' }]
        });

      const summary = await generateSummary('test transcript', 'anthropic', 'test-key');
      expect(summary).toBe('Mock Anthropic Response');
    });
  });
});