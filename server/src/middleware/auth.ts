import { Request, Response, NextFunction } from 'express';
import admin from '../services/firebase-admin.js';
import log from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: any;
}

const verifyAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    log.error('Token verification failed', { error: error.message });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export { verifyAuth };
