import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeMeeting } from './ai-service';
import { AIFactory } from './ai-providers';
import nock from 'nock';

describe('ai-service', () => {
  afterEach(() => {
    nock.cleanAll();
  });
  describe('AIFactory', () => {
    it('should return an OpenAI client when model is openai', () => {
      const provider = AIFactory.getProvider('openai', 'test-key');
      expect(provider.constructor.name).toBe('OpenAIProvider');
    });

    it('should return an Anthropic client when model is anthropic', () => {
      const provider = AIFactory.getProvider('anthropic', 'test-key');
      expect(provider.constructor.name).toBe('AnthropicProvider');
    });

    it('should throw an error for an unsupported model', () => {
      expect(() => AIFactory.getProvider('unsupported-model', 'test-key')).toThrowError('Unsupported AI model');
    });
  });

  describe('analyzeMeeting', () => {
    it('should call OpenAI API correctly', async () => {
      nock('http://localhost')
        .post('/chat/completions')
        .reply(200, {
          choices: [{ message: { content: '{"summary":"Mock OpenAI Response"}' } }]
        });

      const response = await analyzeMeeting('test transcript', 'openai', 'test-key');
      expect(response.summary).toBe('Mock OpenAI Response');
    });

    it('should call Anthropic API correctly', async () => {
      nock('http://localhost')
        .post('/v1/messages')
        .reply(200, {
          content: [{ text: '"summary":"Mock Anthropic Response"}' }]
        });

      const response = await analyzeMeeting('test transcript', 'anthropic', 'test-key');
      expect(response.summary).toBe('Mock Anthropic Response');
    });
  });
});