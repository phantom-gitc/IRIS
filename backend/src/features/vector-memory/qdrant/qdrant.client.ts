import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export const IRIS_MEMORY_COLLECTION = 'iris_memory';
export const DEFAULT_VECTOR_DIMENSION = 768; // Standard dimension for embedding models

let qdrantClientInstance: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (qdrantClientInstance) {
    return qdrantClientInstance;
  }

  try {
    qdrantClientInstance = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY || undefined,
      checkCompatibility: false,
    });
    logger.info({ url: env.QDRANT_URL }, 'Qdrant client initialized');
    return qdrantClientInstance;
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to initialize Qdrant client');
    throw error;
  }
}

export async function ensureMemoryCollection(
  client: QdrantClient = getQdrantClient(),
  dimension: number = DEFAULT_VECTOR_DIMENSION
): Promise<void> {
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === IRIS_MEMORY_COLLECTION);

    if (!exists) {
      await client.createCollection(IRIS_MEMORY_COLLECTION, {
        vectors: {
          size: dimension,
          distance: 'Cosine',
        },
      });

      // Create payload index on userId for fast, isolated filtering
      await client.createPayloadIndex(IRIS_MEMORY_COLLECTION, {
        field_name: 'userId',
        field_schema: 'keyword',
      });

      logger.info({ collection: IRIS_MEMORY_COLLECTION, dimension }, 'Created Qdrant memory collection with userId index');
    }
  } catch (error) {
    logger.warn({ error: (error as Error).message }, 'Qdrant collection setup check notice');
  }
}
