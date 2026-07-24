import { Resend } from 'resend';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';

// Sentinel Note: In a production app, the Resend API key would ideally be configured securely
// via env vars or per-user integrations. Using a generic error if not provided.
const sendDraft = async (to: string, subject: string, body: string, { apiKey = config.email.resendApiKey, from = config.email.from } = {}) => {
  if (!apiKey) {
    throw new AppError('Resend API Key is missing.', 400);
  }
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: subject,
    html: body,
  });

  if (error) {
    throw new AppError(error.message, 500);
  }
  return data;
};

export { sendDraft };
