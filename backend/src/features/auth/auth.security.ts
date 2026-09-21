import argon2 from 'argon2';
import crypto from 'crypto';
import { argon2Options } from '../../config/security';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, argon2Options);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Computes a SHA-256 hash representation of a token for secure database storage.
 * Raw refresh tokens are never persisted in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically secure random token (e.g. for email verification or password reset).
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
