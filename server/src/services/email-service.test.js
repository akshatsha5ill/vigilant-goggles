import { describe, it, expect } from 'vitest';
import { sendDraft } from './email-service';

describe('email-service', () => {
  describe('sendDraft', () => {
    it('should throw an error if the Resend API Key is missing', async () => {
      // Expect that calling sendDraft without the apiKey parameter (and assuming process.env.RESEND_API_KEY is unset)
      // or explicitly passing undefined will throw the required error.
      await expect(sendDraft('test@example.com', 'Subject', 'Body', '')).rejects.toThrow('Resend API Key is missing.');
    });
  });
});
