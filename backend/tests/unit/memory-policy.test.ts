import { describe, it, expect } from 'vitest';
import { MemoryPolicy } from '../../src/features/memory/memory.policy';

describe('Memory Policy & Privacy Filter', () => {
  it('detects and blocks sensitive information from becoming memory', () => {
    expect(MemoryPolicy.isSensitive('My password is secret123')).toBe(true);
    expect(MemoryPolicy.isSensitive('Here is my API_KEY: sk_12345')).toBe(true);
    expect(MemoryPolicy.isSensitive('Bearer eyJhbGciOi...')).toBe(true);
    expect(MemoryPolicy.isSensitive('I like using React and TypeScript')).toBe(false);
  });

  it('identifies explicit memory directives', () => {
    const candidate = MemoryPolicy.evaluateCandidate('Remember that I prefer npm over yarn');
    expect(candidate).not.toBeNull();
    expect(candidate?.content).toBe('I prefer npm over yarn');
    expect(candidate?.memoryType).toBe('PERSONAL_MEMORY');
    expect(candidate?.importance).toBe(9);
    expect(candidate?.isPersistent).toBe(true);
  });

  it('identifies implicit preference statements', () => {
    const candidate = MemoryPolicy.evaluateCandidate('I prefer dark mode in all editors');
    expect(candidate).not.toBeNull();
    expect(candidate?.memoryType).toBe('PERSONAL_MEMORY');
    expect(candidate?.isPersistent).toBe(true);
  });

  it('rejects candidate evaluation for sensitive content', () => {
    const candidate = MemoryPolicy.evaluateCandidate('Remember that my password is 123');
    expect(candidate).toBeNull();
  });
});
