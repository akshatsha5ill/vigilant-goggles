import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { analyzeMeeting } from '../services/ai-service.js';
import { AIFactory } from '../services/ai-providers.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: { uid: string };
}

const analyzeSchema = z.object({
  transcript: z.string().min(10).max(100000, "Transcript too long"),
  meetingId: z.string().min(1),
  model: z.enum(['openai', 'anthropic', 'gemini']).optional(),
  apiKey: z.string().min(1, "Missing API key")
});

router.post(
  '/analyze', 
  validateRequest({ body: analyzeSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { transcript, meetingId, model } = req.body;
      const apiKey = req.body.apiKey;
      // Securely drop API key from memory/request object immediately
      delete req.body.apiKey;
      
      const effectiveModel = model || 'openai';
      const uid = req.user?.uid;

      if (!uid) {
        throw new AppError('Unauthorized: Missing user information.', 401);
      }

      const analysis = await analyzeMeeting(transcript, effectiveModel, apiKey);

      return res.status(200).json({
        status: "success",
        analysis
      });
    } catch (error: any) {
      if (error.message && error.message.includes('API key')) {
        return next(new AppError(error.message, 400));
      }
      next(error);
    }
  }
);

const scoreSchema = z.object({
  transcript: z.string().min(10).max(100000, "Transcript too long"),
  leadContext: z.record(z.any()),
  model: z.enum(['openai', 'anthropic', 'gemini']).optional(),
  apiKey: z.string().min(1, "Missing API key")
});

router.post(
  '/score', 
  validateRequest({ body: scoreSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { transcript, leadContext, model } = req.body;
      const apiKey = req.body.apiKey;
      // Securely drop API key from memory/request object immediately
      delete req.body.apiKey;

      const effectiveModel = model || 'openai';
      const uid = req.user?.uid;
      
      if (!uid) {
        throw new AppError('Unauthorized', 401);
      }

      const provider = AIFactory.getProvider(effectiveModel, apiKey);
      const scoreResult = await provider.scoreLead(transcript, leadContext);

      return res.status(200).json({
        status: "success",
        score: scoreResult
      });
    } catch (error: any) {
      if (error.message && error.message.includes('API key')) {
        return next(new AppError(error.message, 400));
      }
      next(error);
    }
  }
);

export default router;
