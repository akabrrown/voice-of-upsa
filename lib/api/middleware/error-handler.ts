import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string = 'Invalid input data') {
    super(message);
    this.name = 'ValidationError';
  }
}

export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: unknown) {
      console.error('API Error:', error);

      const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
      const message = error instanceof Error ? error.message : 
        (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Internal Server Error');
      const code = error && typeof error === 'object' && 'code' in error ? (error.code as string) : 'INTERNAL_SERVER_ERROR';

      // Ensure we haven't already sent a response
      if (!res.writableEnded) {
        const response: ApiErrorResponse = {
          success: false,
          error: {
            code,
            message,
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
          },
          timestamp: new Date().toISOString(),
        };

        res.status(statusCode).json(response);
      }
    }
  };
}
