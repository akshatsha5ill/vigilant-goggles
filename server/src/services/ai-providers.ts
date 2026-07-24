import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { MEETING_ANALYSIS_PROMPT, EMAIL_DRAFT_PROMPT, LEAD_SCORING_PROMPT } from '../utils/prompts.js';

export interface AIProvider {
  analyzeMeeting(transcript: string): Promise<any>;
  generateEmailDraft?(transcript: string, context: any): Promise<any>;
  scoreLead(transcript: string, leadContext: any): Promise<any>;
}

import { sanitizeObject } from '../utils/sanitize.js';
import { AppError } from '../middleware/errorHandler.js';

const parseAIResponse = (text: string) => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    return sanitizeObject(parsed);
  } catch (err) {
    throw new AppError('Failed to parse AI response as JSON', 500);
  }
};

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    const opts = config.isTest ? { apiKey: 'test-key', baseURL: 'http://localhost' } : { apiKey };
    this.client = new OpenAI(opts);
  }

  async analyzeMeeting(transcript: string) {
    const response = await this.client.chat.completions.create({
      model: config.ai.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MEETING_ANALYSIS_PROMPT },
        { role: "user", content: transcript }
      ],
    });
    return parseAIResponse(response.choices[0].message.content || '');
  }
  
  async generateEmailDraft(transcript: string, context: any) {
    const response = await this.client.chat.completions.create({
      model: config.ai.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EMAIL_DRAFT_PROMPT },
        { role: "user", content: `Context: ${JSON.stringify(context)}\nTranscript: ${transcript}` }
      ],
    });
    return parseAIResponse(response.choices[0].message.content || '');
  }

  async scoreLead(transcript: string, leadContext: any) {
    const response = await this.client.chat.completions.create({
      model: config.ai.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LEAD_SCORING_PROMPT },
        { role: "user", content: `Lead Context: ${JSON.stringify(leadContext)}\nTranscript: ${transcript}` }
      ],
    });
    return parseAIResponse(response.choices[0].message.content || '');
  }
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    const opts = config.isTest ? { apiKey: 'test-key', baseURL: 'http://localhost' } : { apiKey };
    this.client = new Anthropic(opts);
  }

  async analyzeMeeting(transcript: string) {
    const response = await this.client.messages.create({
      model: config.ai.anthropicModel,
      max_tokens: 4096,
      system: MEETING_ANALYSIS_PROMPT,
      messages: [
        { role: "user", content: transcript },
        { role: "assistant", content: "{" }
      ],
    });
    return parseAIResponse("{" + (response.content[0] as any).text);
  }

  async generateEmailDraft(transcript: string, context: any) {
    const response = await this.client.messages.create({
      model: config.ai.anthropicModel,
      max_tokens: 1024,
      system: EMAIL_DRAFT_PROMPT,
      messages: [
        { role: "user", content: `Context: ${JSON.stringify(context)}\nTranscript: ${transcript}` },
        { role: "assistant", content: "{" }
      ],
    });
    return parseAIResponse("{" + (response.content[0] as any).text);
  }

  async scoreLead(transcript: string, leadContext: any) {
    const response = await this.client.messages.create({
      model: config.ai.anthropicModel,
      max_tokens: 1024,
      system: LEAD_SCORING_PROMPT,
      messages: [
        { role: "user", content: `Lead Context: ${JSON.stringify(leadContext)}\nTranscript: ${transcript}` },
        { role: "assistant", content: "{" }
      ],
    });
    return parseAIResponse("{" + (response.content[0] as any).text);
  }
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  
  constructor(apiKey: string) {
    const opts = config.isTest ? { apiKey: 'test-key' } : { apiKey };
    this.client = new GoogleGenAI(opts);
  }

  async analyzeMeeting(transcript: string) {
    const response = await this.client.models.generateContent({
      model: config.ai.geminiModel,
      contents: transcript,
      config: {
        systemInstruction: MEETING_ANALYSIS_PROMPT,
        responseMimeType: "application/json"
      }
    });
    return parseAIResponse(response.text || '');
  }

  async generateEmailDraft(transcript: string, context: any) {
    const response = await this.client.models.generateContent({
      model: config.ai.geminiModel,
      contents: `Context: ${JSON.stringify(context)}\nTranscript: ${transcript}`,
      config: {
        systemInstruction: EMAIL_DRAFT_PROMPT,
        responseMimeType: "application/json"
      }
    });
    return parseAIResponse(response.text || '');
  }

  async scoreLead(transcript: string, leadContext: any) {
    const response = await this.client.models.generateContent({
      model: config.ai.geminiModel,
      contents: `Lead Context: ${JSON.stringify(leadContext)}\nTranscript: ${transcript}`,
      config: {
        systemInstruction: LEAD_SCORING_PROMPT,
        responseMimeType: "application/json"
      }
    });
    return parseAIResponse(response.text || '');
  }
}

export class AIFactory {
  static getProvider(model: string, apiKey: string): AIProvider {
    switch(model) {
      case 'openai': return new OpenAIProvider(apiKey);
      case 'anthropic': return new AnthropicProvider(apiKey);
      case 'gemini': return new GeminiProvider(apiKey);
      default: throw new AppError('Unsupported AI model', 400);
    }
  }
}
