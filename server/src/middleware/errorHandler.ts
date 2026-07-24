import { Request, Response, NextFunction } from 'express';
import log from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error('Server Error', { message: err.message, stack: err.stack, requestId });
    } else {
      log.warn('Client Error', { message: err.message, requestId });
    }
    return res.status(err.statusCode).json({
      status: 'error',
      error: err.message
    });
  }

  log.error('Unhandled Error', { message: err.message, stack: err.stack, requestId });
  
  return res.status(500).json({
    status: 'error',
    error: 'Internal Server Error'
  });
};
