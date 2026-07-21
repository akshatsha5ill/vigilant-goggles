import { apiClient } from '../api/client';

export const analyzeMeeting = async (transcript, meetingId, apiKey, model) => {
  return apiClient.post('/ai/analyze', {
    transcript,
    meetingId,
    apiKey,
    model,
  });
};

export const generateEmailDraft = async (transcript, leadContext, apiKey, model) => {
  return apiClient.post('/email/draft', {
    transcript,
    leadContext,
    apiKey,
    model,
  });
};

export const sendEmail = async (to, subject, body) => {
  return apiClient.post('/email/send', { to, subject, body });
};
