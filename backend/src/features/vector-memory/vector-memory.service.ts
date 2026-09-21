import { nanoid } from 'nanoid';
import { getQdrantClient, ensureMemoryCollection, IRIS_MEMORY_COLLECTION } from './qdrant/qdrant.client';
import { embeddingProvider } from './embedding.service';
import { logger } from '../../config/logger';

export interface VectorSearchResult {
  memoryId: string;
  score: number;
  payload?: Record<string, unknown>;
}

export class VectorMemoryService {
  private collectionReady = false;

  private async ensureReady(): Promise<void> {
    if (!this.collectionReady) {
      await ensureMemoryCollection(getQdrantClient(), embeddingProvider.dimension);
      this.collectionReady = true;
    }
  }

  async upsertMemoryVector(
    userId: string,
    memoryId: string,
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    await this.ensureReady();
    const client = getQdrantClient();
    const vector = await embeddingProvider.embedQuery(content);
    // Qdrant UUID format or random hex ID
    const pointId = nanoid(32).replace(/[^a-zA-Z0-9]/g, 'a');

    try {
      await client.upsert(IRIS_MEMORY_COLLECTION, {
        points: [
          {
            id: pointId,
            vector,
            payload: {
              userId, // Mandatory for isolation
              memoryId,
              content,
              ...metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      });

      return pointId;
    } catch (error) {
      logger.error({ error: (error as Error).message, userId, memoryId }, 'Failed to upsert vector in Qdrant');
      throw error;
    }
  }

  async searchUserMemories(
    userId: string,
    queryText: string,
    limit = 5,
    scoreThreshold = 0.5
  ): Promise<VectorSearchResult[]> {
    await this.ensureReady();
    const client = getQdrantClient();
    const queryVector = await embeddingProvider.embedQuery(queryText);

    try {
      // CRITICAL: Strictly enforce user isolation filter
      const searchResponse = await client.query(IRIS_MEMORY_COLLECTION, {
        query: queryVector,
        filter: {
          must: [
            {
              key: 'userId',
              match: {
                value: userId,
              },
            },
          ],
        },
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
      });

      return (searchResponse.points || []).map((hit: any) => ({
        memoryId: (hit.payload?.memoryId as string) || '',
        score: hit.score,
        payload: hit.payload as Record<string, unknown>,
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message, userId }, 'Qdrant vector search failed, returning empty');
      return [];
    }
  }

  async deleteMemoryVector(userId: string, vectorId: string): Promise<boolean> {
    await this.ensureReady();
    const client = getQdrantClient();

    try {
      // Enforce user isolation on deletion as well
      await client.delete(IRIS_MEMORY_COLLECTION, {
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
          ],
        },
        points: [vectorId],
      });
      return true;
    } catch (error) {
      logger.warn({ error: (error as Error).message, userId, vectorId }, 'Failed to delete vector from Qdrant');
      return false;
    }
  }
}

export const vectorMemoryService = new VectorMemoryService();
