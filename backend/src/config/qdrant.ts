import { getQdrantClient, ensureMemoryCollection, IRIS_MEMORY_COLLECTION, DEFAULT_VECTOR_DIMENSION } from '../features/vector-memory/qdrant/qdrant.client';
import { logger } from './logger';

export { getQdrantClient, ensureMemoryCollection, IRIS_MEMORY_COLLECTION, DEFAULT_VECTOR_DIMENSION };

export async function checkQdrantHealth(): Promise<{ status: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const client = getQdrantClient();
    await client.getCollections();
    return {
      status: 'connected',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Qdrant health check failed');
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
    };
  }
}
