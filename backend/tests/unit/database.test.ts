import { describe, it, expect } from 'vitest';
import { checkDatabaseHealth } from '../../src/config/database';

describe('Database Configuration & Health', () => {
  it('returns valid DatabaseHealth structure when called', async () => {
    const health = await checkDatabaseHealth();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('readyState');
    expect(['disconnected', 'connected', 'connecting', 'unhealthy']).toContain(health.status);
    expect(typeof health.readyState).toBe('number');
  });
});
