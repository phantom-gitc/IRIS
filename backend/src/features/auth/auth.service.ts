import { User, IUser } from '../users/user.model';
import { hashPassword, verifyPassword, hashToken, generateRandomToken } from './auth.security';
import { generateAuthTokens, verifyRefreshToken } from './auth.tokens';
import { sessionService } from '../sessions/session.service';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from './auth.validation';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors';
import { AuthTokens } from './auth.types';

export class AuthService {
  async register(
    input: RegisterInput,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: IUser; tokens: AuthTokens }> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = generateRandomToken(32);
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      email: input.email,
      passwordHash,
      name: input.name,
      isVerified: false,
      verificationTokenHash,
      verificationExpires,
      roles: ['user'],
    });

    try {
      const tokens = await generateAuthTokens({
        sub: user._id.toString(),
        sessionId: '', // Will be updated
        email: user.email,
        roles: [...user.roles],
      });

      const session = await sessionService.createSession(user._id, tokens.refreshToken, {
        deviceId: input.deviceId,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      });

      // Re-issue tokens with valid sessionId
      const finalTokens = await generateAuthTokens({
        sub: user._id.toString(),
        sessionId: session._id.toString(),
        email: user.email,
        roles: [...user.roles],
      });

      // Update session refresh token hash to match final token
      session.refreshTokenHash = hashToken(finalTokens.refreshToken);
      await session.save();

      return { user, tokens: finalTokens };
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err;
    }
  }

  async login(
    input: LoginInput,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user) {
      // Generic error to prevent email enumeration
      throw new AuthenticationError('Invalid email or password');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const initialTokens = await generateAuthTokens({
      sub: user._id.toString(),
      sessionId: '',
      email: user.email,
      roles: [...user.roles],
    });

    const session = await sessionService.createSession(user._id, initialTokens.refreshToken, {
      deviceId: input.deviceId,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    const finalTokens = await generateAuthTokens({
      sub: user._id.toString(),
      sessionId: session._id.toString(),
      email: user.email,
      roles: [...user.roles],
    });

    session.refreshTokenHash = hashToken(finalTokens.refreshToken);
    await session.save();

    return { user, tokens: finalTokens };
  }

  async refresh(oldRefreshToken: string): Promise<AuthTokens> {
    const payload = await verifyRefreshToken(oldRefreshToken);

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    const newTokens = await generateAuthTokens({
      sub: user._id.toString(),
      sessionId: payload.sessionId,
      email: user.email,
      roles: [...user.roles],
    });

    await sessionService.validateAndRotateSession(
      payload.sessionId,
      oldRefreshToken,
      newTokens.refreshToken
    );

    return newTokens;
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await sessionService.revokeSession(sessionId, userId);
  }

  async logoutAll(userId: string): Promise<number> {
    return sessionService.revokeAllUserSessions(userId);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    user.passwordHash = await hashPassword(input.newPassword);
    await user.save();

    // Revoke all existing sessions for security
    await sessionService.revokeAllUserSessions(userId);
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email });
    if (!user) {
      // Return dummy token or silence to avoid email enumeration
      return '';
    }

    const resetToken = generateRandomToken(32);
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return resetToken;
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const hashed = hashToken(input.token);
    const user = await User.findOne({
      passwordResetTokenHash: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    user.passwordHash = await hashPassword(input.newPassword);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await sessionService.revokeAllUserSessions(user._id.toString());
  }

  async verifyEmail(token: string): Promise<void> {
    const hashed = hashToken(token);
    const user = await User.findOne({
      verificationTokenHash: hashed,
      verificationExpires: { $gt: new Date() },
    }).select('+verificationTokenHash +verificationExpires');

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationExpires = undefined;
    await user.save();
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, input: { name?: string }): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.name !== undefined) {
      user.name = input.name.trim();
    }

    await user.save();
    return user;
  }
}

export const authService = new AuthService();
