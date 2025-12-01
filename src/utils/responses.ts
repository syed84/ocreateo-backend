import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: any = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500
): void => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};