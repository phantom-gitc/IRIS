import { Router } from 'express';
import { authController } from './auth.controller';
import { authRateLimiter } from '../../middleware/rate-limit.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

// Public auth endpoints protected with strict authRateLimiter
authRouter.post('/register', authRateLimiter, (req, res, next) => authController.register(req, res, next));
authRouter.post('/login', authRateLimiter, (req, res, next) => authController.login(req, res, next));
authRouter.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
authRouter.post('/forgot-password', authRateLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post('/reset-password', authRateLimiter, (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post('/verify-email', (req, res, next) => authController.verifyEmail(req, res, next));

// Authenticated session & account endpoints
authRouter.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
authRouter.patch('/me', requireAuth, (req, res, next) => authController.updateMe(req, res, next));
authRouter.post('/logout', requireAuth, (req, res, next) => authController.logout(req, res, next));
authRouter.post('/logout-all', requireAuth, (req, res, next) => authController.logoutAll(req, res, next));
authRouter.post('/change-password', requireAuth, (req, res, next) => authController.changePassword(req, res, next));
