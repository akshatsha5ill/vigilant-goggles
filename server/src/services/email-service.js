const { Resend } = require('resend');

// Sentinel Note: In a production app, the Resend API key would ideally be configured securely
// via env vars or per-user integrations. Using a generic error if not provided.
const sendDraft = async (to, subject, body, apiKey = process.env.RESEND_API_KEY) => {
  if (!apiKey) {
    throw new Error('Resend API Key is missing.');
  }
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: 'MeetFlow <onboarding@resend.dev>',
    to: [to],
    subject: subject,
    html: body,
  });

  if (error) {
    throw error;
  }
  return data;
};

module.exports = { sendDraft };
