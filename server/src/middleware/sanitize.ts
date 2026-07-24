import { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize.js';

const sanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

export default sanitize;
