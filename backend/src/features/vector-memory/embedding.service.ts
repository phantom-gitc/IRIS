import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface EmbeddingProvider {
  name: string;
  dimension: number;
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'gemini-text-embedding';
  public readonly dimension = 768;
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      } catch (err) {
        logger.warn({ error: (err as Error).message }, 'Failed to initialize Gemini embedding client');
      }
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!this.ai) {
      // Deterministic fallback representation for tests/dev when API key is not active
      return this.generateDeterministicVector(text, this.dimension);
    }

    try {
      // Use Gemini embedding API with 768 dimensions to match Qdrant collection
      const response = await (this.ai as any).models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: {
          outputDimensionality: this.dimension,
        },
      });
      const values = response.embedding?.values || response.embeddings?.[0]?.values;
      if (values && Array.isArray(values)) {
        return values;
      }
      return this.generateDeterministicVector(text, this.dimension);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Gemini embed failed, using fallback vector');
      return this.generateDeterministicVector(text, this.dimension);
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }

  private generateDeterministicVector(text: string, dim: number): number[] {
    // Generates a normalized unit-vector based on character hash for offline / test resilience
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vec[i % dim] += code / 255;
    }
    // Normalize to unit length
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export const embeddingProvider: EmbeddingProvider = new GeminiEmbeddingProvider();
