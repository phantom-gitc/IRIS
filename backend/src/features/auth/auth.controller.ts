import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation';
import { cookieConfig } from '../../config/security';
import { ApiResponse } from '../../shared/types';
import { AuthenticationError } from '../../shared/errors';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const { user, tokens } = await authService.register(input, metadata);

      // Set rotating refresh token in secure HttpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

      const response: ApiResponse<{ user: typeof user; accessToken: string; expiresIn: number }> = {
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const { user, tokens } = await authService.login(input, metadata);

      res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

      const response: ApiResponse<{ user: typeof user; accessToken: string; expiresIn: number }> = {
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token required');
      }

      const tokens = await authService.refresh(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

      const response: ApiResponse<{ accessToken: string; expiresIn: number }> = {
        success: true,
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      res.clearCookie('refreshToken', {
        httpOnly: cookieConfig.refreshToken.httpOnly,
        secure: cookieConfig.refreshToken.secure,
        sameSite: cookieConfig.refreshToken.sameSite,
        path: cookieConfig.refreshToken.path,
      });
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logout(req.user.sessionId, req.user.id);
      }
      res.clearCookie('refreshToken', cookieConfig.refreshToken);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      const count = await authService.logoutAll(req.user.id);
      res.clearCookie('refreshToken', cookieConfig.refreshToken);

      const response: ApiResponse<{ revokedSessionsCount: number }> = {
        success: true,
        data: { revokedSessionsCount: count },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      const input = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.id, input);
      res.clearCookie('refreshToken', cookieConfig.refreshToken);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Password changed successfully. Please log in again.' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(input.email);

      // Generic response to prevent account enumeration
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'If that email address is registered, a password reset link has been sent.' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(input);
      res.clearCookie('refreshToken', cookieConfig.refreshToken);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Password reset successfully. Please log in with your new password.' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyEmailSchema.parse(req.body);
      await authService.verifyEmail(input.token);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Email verified successfully.' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getProfile(userId);

      const response: ApiResponse<{ user: typeof user }> = {
        success: true,
        data: { user },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      const user = await authService.updateProfile(userId, { name });

      const response: ApiResponse<{ user: typeof user }> = {
        success: true,
        data: { user },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
