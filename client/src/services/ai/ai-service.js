import { apiClient } from '../api/client';

export const analyzeMeeting = async (transcript, meetingId, apiKey, model) => {
  return apiClient.post('/ai', {
    transcript,
    meetingId,
    apiKey,
    model
  });
};
