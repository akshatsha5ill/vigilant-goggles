const { sendDraft } = require('./email-service');
const { Resend } = require('resend');

jest.mock('resend');

describe('email-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDraft', () => {
    it('should throw an error if API key is missing', async () => {
      await expect(sendDraft('test@example.com', 'Subject', 'Body', undefined)).rejects.toThrow('Resend API Key is missing.');
      await expect(sendDraft('test@example.com', 'Subject', 'Body', '')).rejects.toThrow('Resend API Key is missing.');
      await expect(sendDraft('test@example.com', 'Subject', 'Body', null)).rejects.toThrow('Resend API Key is missing.');
    });

    it('should send an email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email_id' }, error: null });
      Resend.mockImplementation(() => {
        return {
          emails: {
            send: mockSend,
          },
        };
      });

      const result = await sendDraft('test@example.com', 'Subject', '<p>Body</p>', 'mock_api_key');

      expect(Resend).toHaveBeenCalledWith('mock_api_key');
      expect(mockSend).toHaveBeenCalledWith({
        from: 'MeetFlow <onboarding@resend.dev>',
        to: ['test@example.com'],
        subject: 'Subject',
        html: '<p>Body</p>',
      });
      expect(result).toEqual({ id: 'email_id' });
    });

    it('should throw an error if sending email fails', async () => {
      const mockError = new Error('Failed to send email');
      const mockSend = jest.fn().mockResolvedValue({ data: null, error: mockError });
      Resend.mockImplementation(() => {
        return {
          emails: {
            send: mockSend,
          },
        };
      });

      await expect(sendDraft('test@example.com', 'Subject', '<p>Body</p>', 'mock_api_key')).rejects.toThrow('Failed to send email');
      expect(Resend).toHaveBeenCalledWith('mock_api_key');
      expect(mockSend).toHaveBeenCalledWith({
        from: 'MeetFlow <onboarding@resend.dev>',
        to: ['test@example.com'],
        subject: 'Subject',
        html: '<p>Body</p>',
      });
    });
  });
});
