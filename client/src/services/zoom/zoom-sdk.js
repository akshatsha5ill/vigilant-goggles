import { apiClient } from '../api/client';

export const initZoom = async () => {
  return apiClient.get('/zoom');
};
