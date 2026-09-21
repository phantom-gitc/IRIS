import { MemoryType } from './memory.model';

export interface MemoryCandidate {
  content: string;
  memoryType: MemoryType;
  importance: number;
  tags: string[];
  isPersistent: boolean;
}

export class MemoryPolicy {
  private static readonly BLOCKED_PATTERNS = [
    /password/i,
    /api[_-]?key/i,
    /secret/i,
    /bearer\s+[A-Za-z0-9_-]+/i,
    /private[_-]?key/i,
    /credit[_-]?card/i,
    /token/i,
  ];

  /**
   * Evaluates whether a piece of content contains sensitive secrets that should NEVER be stored.
   */
  static isSensitive(text: string): boolean {
    return this.BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
  }

  /**
   * Evaluates user statements to detect explicit or implicit memory requests.
   */
  static evaluateCandidate(text: string): MemoryCandidate | null {
    if (this.isSensitive(text)) {
      return null;
    }

    const trimmed = text.trim();

    // Explicit user memory request: "Remember that ...", "Please remember ...", "Note that ..."
    const explicitMatch = trimmed.match(/^(?:please\s+)?(?:remember(?:\s+that)?|note(?:\s+that)?)\s+(.+)/i);
    if (explicitMatch && explicitMatch[1]) {
      return {
        content: explicitMatch[1].trim(),
        memoryType: 'PERSONAL_MEMORY',
        importance: 9,
        tags: ['explicit_preference'],
        isPersistent: true,
      };
    }

    // Preference indicator: "I prefer ...", "My project is ...", "I usually use ..."
    if (/\b(?:i\s+prefer|i\s+like|my\s+preference|i\s+always\s+use|i\s+work\s+on)\b/i.test(trimmed)) {
      return {
        content: trimmed,
        memoryType: 'PERSONAL_MEMORY',
        importance: 7,
        tags: ['inferred_preference'],
        isPersistent: true,
      };
    }

    // Default conversational working memory
    return {
      content: trimmed,
      memoryType: 'CONVERSATION_MEMORY',
      importance: 4,
      tags: ['conversation'],
      isPersistent: false,
    };
  }
}
