import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Database

  MONGODB_URI: z.string().min(1, 'MongoDB connection URI is required'),

  // Qdrant

  QDRANT_URL: z.string().min(1, 'Qdrant URL is required'),
  QDRANT_API_KEY: z.string().optional().default(''),

  // AI & Voice Providers

  AI_PROVIDER: z.enum(['groq', 'gemini']).default('groq'),
  GROQ_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  SARVAM_API_KEY: z.string().optional().default(''),

  // JWT Secrets

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT access secret must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT refresh secret must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // LiveKit

  LIVEKIT_URL: z.string().optional().default(''),
  LIVEKIT_API_KEY: z.string().optional().default(''),
  LIVEKIT_API_SECRET: z.string().optional().default(''),

  // Email / SMTP
  
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('no-reply@iris.ai'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(rawEnv: Record<string, string | undefined> = process.env): EnvConfig {
  const normalized = {
    PORT: rawEnv.PORT,
    NODE_ENV: rawEnv.NODE_ENV,
    FRONTEND_URL: rawEnv.FRONTEND_URL,

    // Allow both MONGODB_URI and MONGO_URI
    MONGODB_URI: rawEnv.MONGODB_URI || rawEnv.MONGO_URI || 'mongodb://localhost:27017/iris',

    // Allow both QDRANT_URL and QDRANT_CLUSTER_ENDPOINT
    QDRANT_URL: rawEnv.QDRANT_URL || rawEnv.QDRANT_CLUSTER_ENDPOINT || 'http://localhost:6333',
    QDRANT_API_KEY: rawEnv.QDRANT_API_KEY || '',

    AI_PROVIDER: rawEnv.AI_PROVIDER || 'groq',
    GROQ_API_KEY: rawEnv.GROQ_API_KEY || '',
    GEMINI_API_KEY: rawEnv.GEMINI_API_KEY || '',
    SARVAM_API_KEY: rawEnv.SARVAM_API_KEY || '',

    // Allow both JWT_ACCESS_SECRET and ACCESS_TOKEN_SECRET (falling back to JWT_SECRET if present)
    JWT_ACCESS_SECRET:
      rawEnv.JWT_ACCESS_SECRET ||
      rawEnv.ACCESS_TOKEN_SECRET ||
      rawEnv.JWT_SECRET ||
      'dev_access_secret_min_32_characters_key_iris',
    // Allow both JWT_REFRESH_SECRET and REFRESH_TOKEN_SECRET (falling back to JWT_SECRET if present)
    JWT_REFRESH_SECRET:
      rawEnv.JWT_REFRESH_SECRET ||
      rawEnv.REFRESH_TOKEN_SECRET ||
      rawEnv.JWT_SECRET ||
      'dev_refresh_secret_min_32_characters_key_iris',
    JWT_ACCESS_EXPIRES_IN: rawEnv.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: rawEnv.JWT_REFRESH_EXPIRES_IN || '7d',

    LIVEKIT_URL: rawEnv.LIVEKIT_URL || '',
    LIVEKIT_API_KEY: rawEnv.LIVEKIT_API_KEY || '',
    LIVEKIT_API_SECRET: rawEnv.LIVEKIT_API_SECRET || '',

    SMTP_HOST: rawEnv.SMTP_HOST || '',
    SMTP_PORT: rawEnv.SMTP_PORT || 587,
    SMTP_USER: rawEnv.SMTP_USER || '',
    SMTP_PASS: rawEnv.SMTP_PASS || '',
    EMAIL_FROM: rawEnv.EMAIL_FROM || 'no-reply@iris.ai',
  };

  const result = envSchema.safeParse(normalized);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Environment configuration error: ${issues}`);
  }

  return result.data;
}

export const env = loadConfig();
