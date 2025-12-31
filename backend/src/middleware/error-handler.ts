import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details,
    },
  });
}

export function createError(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: unknown
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

