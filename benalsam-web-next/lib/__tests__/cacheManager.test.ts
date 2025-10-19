import { describe, it, expect, beforeEach } from 'vitest';
import { cacheManager } from '../cacheManager';

describe('cacheManager', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  it('should set and get cache', () => {
    cacheManager.set('foo', 123, 1000);
    expect(cacheManager.get('foo')).toBe(123);
  });

  it('should expire cache after ttl', async () => {
    cacheManager.set('bar', 456, 10);
    await new Promise(r => setTimeout(r, 20));
    expect(cacheManager.get('bar')).toBeNull();
  });

  it('should invalidate by pattern', () => {
    cacheManager.set('a:1', 1);
    cacheManager.set('a:2', 2);
    cacheManager.set('b:1', 3);
    expect(cacheManager.invalidatePattern('a:')).toBe(2);
    expect(cacheManager.get('a:1')).toBeNull();
    expect(cacheManager.get('b:1')).toBe(3);
  });
}); 