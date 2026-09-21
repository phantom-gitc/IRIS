import { Memory, IMemory } from './memory.model';
import { vectorMemoryService } from '../vector-memory/vector-memory.service';
import { CreateMemoryInput, UpdateMemoryInput, QueryMemoryInput } from './memory.validation';
import { MemoryPolicy } from './memory.policy';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class MemoryService {
  async createMemory(userId: string, input: CreateMemoryInput): Promise<IMemory> {
    if (MemoryPolicy.isSensitive(input.content)) {
      throw new ValidationError('Content contains sensitive information and cannot be saved as memory');
    }

    const memory = await Memory.create({
      userId,
      content: input.content,
      memoryType: input.memoryType,
      importance: input.importance,
      tags: input.tags,
      source: input.source,
      sourceId: input.sourceId,
    });

    try {
      const vectorId = await vectorMemoryService.upsertMemoryVector(
        userId,
        memory._id.toString(),
        memory.content,
        {
          memoryType: memory.memoryType,
          importance: memory.importance,
        }
      );

      memory.vectorId = vectorId;
      await memory.save();
    } catch (err) {
      logger.warn({ error: (err as Error).message, memoryId: memory._id }, 'Failed to index memory into Qdrant, stored in MongoDB only');
    }

    return memory;
  }

  async getMemories(userId: string, query: QueryMemoryInput): Promise<IMemory[]> {
    // If semantic search query is provided, query Qdrant first, then hydrate from MongoDB
    if (query.query && query.query.trim()) {
      const vectorResults = await vectorMemoryService.searchUserMemories(
        userId,
        query.query,
        query.limit
      );

      if (vectorResults.length === 0) {
        return [];
      }

      const memoryIds = vectorResults.map((r) => r.memoryId).filter(Boolean);
      const records = await Memory.find({
        _id: { $in: memoryIds },
        userId, // Strictly enforce user isolation
      });

      // Maintain relevance score ordering
      const recordMap = new Map<string, IMemory>(records.map((r) => [r._id.toString(), r as IMemory]));
      const ordered: IMemory[] = [];
      for (const id of memoryIds) {
        const found = recordMap.get(id);
        if (found) ordered.push(found);
      }
      return ordered;
    }

    const filter: Record<string, unknown> = { userId };
    if (query.memoryType) {
      filter['memoryType'] = query.memoryType;
    }

    return Memory.find(filter)
      .sort({ importance: -1, createdAt: -1 })
      .limit(query.limit)
      .exec();
  }

  async updateMemory(userId: string, memoryId: string, input: UpdateMemoryInput): Promise<IMemory> {
    const memory = await Memory.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw new NotFoundError('Memory not found');
    }

    if (input.content && MemoryPolicy.isSensitive(input.content)) {
      throw new ValidationError('Updated content contains sensitive information');
    }

    if (input.content !== undefined) memory.content = input.content;
    if (input.importance !== undefined) memory.importance = input.importance;
    if (input.tags !== undefined) memory.tags = input.tags;

    await memory.save();

    if (input.content && memory.vectorId) {
      try {
        await vectorMemoryService.upsertMemoryVector(
          userId,
          memory._id.toString(),
          memory.content,
          { memoryType: memory.memoryType, importance: memory.importance }
        );
      } catch (err) {
        logger.warn({ error: (err as Error).message }, 'Failed to update Qdrant vector on memory update');
      }
    }

    return memory;
  }

  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const memory = await Memory.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw new NotFoundError('Memory not found');
    }

    if (memory.vectorId) {
      await vectorMemoryService.deleteMemoryVector(userId, memory.vectorId);
    }

    await Memory.deleteOne({ _id: memoryId, userId });
  }
}

export const memoryService = new MemoryService();
