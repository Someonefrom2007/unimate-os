/**
 * SupabaseSyncAdapter unit tests — sync behavior, syncAll wrapper.
 */
import { describe, expect, it } from 'vitest';
import { isSyncConfigured, createSyncAdapter, syncAll } from './supabaseAdapter';

describe('isSyncConfigured', () => {
  it('returns a boolean', () => {
    expect(typeof isSyncConfigured()).toBe('boolean');
  });
});

describe('createSyncAdapter', () => {
  it('returns an adapter with correct shape', () => {
    const adapter = createSyncAdapter();
    expect(typeof adapter.enabled).toBe('boolean');
    expect(typeof adapter.push).toBe('function');
    expect(typeof adapter.pull).toBe('function');
    expect(typeof adapter.ping).toBe('function');
  });

  it('adapter push returns boolean', async () => {
    const adapter = createSyncAdapter();
    const result = await adapter.push({ courses: [] });
    expect(typeof result).toBe('boolean');
  });

  it('adapter pull returns array or null', async () => {
    const adapter = createSyncAdapter();
    const result = await adapter.pull();
    expect(result === null || typeof result === 'object').toBe(true);
  });
});

describe('syncAll', () => {
  it('returns result object with correct shape', async () => {
    const adapter = createSyncAdapter();
    const result = await syncAll(adapter, { courses: [] });
    expect(typeof result.ok).toBe('boolean');
    expect(result.pulled === null || typeof result.pulled === 'object').toBe(true);
  });
});
