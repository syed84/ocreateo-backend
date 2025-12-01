import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/responses';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        sendError(res, 'Email and password are required', 400);
        return;
      }

      const result = await authService.register(email, password, role);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        sendError(res, error.message, 409);
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'Email and password are required', 400);
        return;
      }

      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        sendError(res, error.message, 401);
      } else {
        next(error);
      }
    }
  }
}

export default new AuthController();