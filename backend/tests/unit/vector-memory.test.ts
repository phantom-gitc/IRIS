import { describe, it, expect } from 'vitest';
import { embeddingProvider } from '../../src/features/vector-memory/embedding.service';
import { getQdrantClient } from '../../src/features/vector-memory/qdrant/qdrant.client';
import { checkQdrantHealth } from '../../src/config/qdrant';

describe('Vector Memory & Qdrant Integration', () => {
  it('embedding provider generates valid vector of configured dimension', async () => {
    const vector = await embeddingProvider.embedQuery('Hello IRIS vector memory');
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(embeddingProvider.dimension);
    expect(typeof vector[0]).toBe('number');
  });

  it('embedDocuments generates multiple vectors', async () => {
    const vectors = await embeddingProvider.embedDocuments(['Doc 1', 'Doc 2']);
    expect(vectors.length).toBe(2);
    expect(vectors[0]?.length).toBe(embeddingProvider.dimension);
    expect(vectors[1]?.length).toBe(embeddingProvider.dimension);
  });

  it('initializes Qdrant client successfully', () => {
    const client = getQdrantClient();
    expect(client).toBeDefined();
  });

  it('checkQdrantHealth returns health object', async () => {
    const health = await checkQdrantHealth();
    expect(health).toHaveProperty('status');
    expect(['connected', 'unhealthy']).toContain(health.status);
  });
});
