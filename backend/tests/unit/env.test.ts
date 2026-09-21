import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config/env';

describe('Environment Configuration Loader', () => {
  it('loads default values with minimal configuration', () => {
    const config = loadConfig({
      MONGODB_URI: 'mongodb://localhost:27017/test',
      QDRANT_URL: 'http://localhost:6333',
      JWT_ACCESS_SECRET: 'super_secret_access_token_key_123',
      JWT_REFRESH_SECRET: 'super_secret_refresh_token_key_123',
    });

    expect(config.PORT).toBe(5000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.AI_PROVIDER).toBe('groq');
    expect(config.MONGODB_URI).toBe('mongodb://localhost:27017/test');
  });

  it('correctly maps aliases: MONGO_URI, QDRANT_CLUSTER_ENDPOINT, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET', () => {
    const config = loadConfig({
      MONGO_URI: 'mongodb://mongo-alias:27017/iris_alias',
      QDRANT_CLUSTER_ENDPOINT: 'https://qdrant-alias.io:6333',
      ACCESS_TOKEN_SECRET: 'alias_access_secret_min_32_characters_key',
      REFRESH_TOKEN_SECRET: 'alias_refresh_secret_min_32_characters_key',
      GROQ_API_KEY: 'test_groq_key',
    });

    expect(config.MONGODB_URI).toBe('mongodb://mongo-alias:27017/iris_alias');
    expect(config.QDRANT_URL).toBe('https://qdrant-alias.io:6333');
    expect(config.JWT_ACCESS_SECRET).toBe('alias_access_secret_min_32_characters_key');
    expect(config.JWT_REFRESH_SECRET).toBe('alias_refresh_secret_min_32_characters_key');
    expect(config.GROQ_API_KEY).toBe('test_groq_key');
  });

  it('rejects short JWT secrets with descriptive error', () => {
    expect(() =>
      loadConfig({
        MONGODB_URI: 'mongodb://localhost:27017/test',
        QDRANT_URL: 'http://localhost:6333',
        JWT_ACCESS_SECRET: 'short', // under 16 chars
        JWT_REFRESH_SECRET: 'short',
      })
    ).toThrow(/Environment configuration error/);
  });
});
