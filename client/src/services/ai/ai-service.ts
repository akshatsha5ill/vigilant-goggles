import { apiClient } from '../api/client';

export const analyzeMeeting = async (transcript: string, meetingId: string, apiKey: string, model: string) => {
  return apiClient.post('/ai/analyze', {
    transcript,
    meetingId,
    apiKey,
    model,
  });
};

export const generateEmailDraft = async (transcript: string, leadContext: Record<string, any>, apiKey: string, model: string) => {
  return apiClient.post('/email/draft', {
    transcript,
    leadContext,
    apiKey,
    model,
  });
};

export const sendEmail = async (to: string, subject: string, body: string, emailApiKey: string) => {
  return apiClient.post('/email/send', { to, subject, body, emailApiKey });
};

export const scoreLead = async (transcript: string, leadContext: Record<string, any>, apiKey: string, model: string) => {
  return apiClient.post('/ai/score', {
    transcript,
    leadContext,
    apiKey,
    model,
  });
};
