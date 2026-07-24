import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { sendDraft } from '../services/email-service.js';
import { AIFactory } from '../services/ai-providers.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { uid: string };
}

const sendSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  emailApiKey: z.string().min(1, "Missing Email API key")
});

router.post(
  '/send', 
  validateRequest({ body: sendSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { to, subject, body } = req.body;
      const emailApiKey = req.body.emailApiKey;
      delete req.body.emailApiKey;
      
      const data = await sendDraft(to, subject, body, { apiKey: emailApiKey });
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }
);

const draftSchema = z.object({
  transcript: z.string().min(10).max(100000, "Transcript too long"),
  leadContext: z.record(z.any()).optional(),
  model: z.enum(['openai', 'anthropic', 'gemini']).optional(),
  apiKey: z.string().min(1, "Missing API key")
});

router.post(
  '/draft',
  validateRequest({ body: draftSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { transcript, leadContext, model } = req.body;
      const apiKey = req.body.apiKey;
      // Securely drop API key from memory/request object immediately
      delete req.body.apiKey;

      const uid = req.user?.uid;
      
      if (!uid) {
        throw new AppError('Unauthorized', 401);
      }

      const effectiveModel = model || 'openai';
      const provider = AIFactory.getProvider(effectiveModel, apiKey);

      if (!provider.generateEmailDraft) {
        throw new AppError('Email drafting not supported for this provider yet.', 501);
      }

      const draft = await provider.generateEmailDraft(transcript, leadContext || {});
      return res.status(200).json({ status: 'success', draft });
    } catch (error: any) {
      if (error.message && error.message.includes('API key')) {
        return next(new AppError(error.message, 400));
      }
      next(error);
    }
  }
);

export default router;
