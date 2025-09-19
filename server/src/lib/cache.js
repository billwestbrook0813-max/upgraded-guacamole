
import Redis from 'ioredis';

let redis = null;
export function getRedis() {
  if (redis !== null) return redis;
  const url = process.env.REDIS_URL || '';
  if (!url) return null;
  try {
    redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
    redis.on('error', (e)=>console.error('[redis]', e.message));
    return redis;
  } catch (e) {
    console.error('[redis-init]', e.message);
    return null;
  }
}

export async function cached(key, ttlSec, fetcher) {
  const r = getRedis();
  if (!r) return await fetcher();
  try {
    const hit = await r.get(key);
    if (hit) return JSON.parse(hit);
  } catch {}
  const val = await fetcher();
  try {
    await r.set(key, JSON.stringify(val), 'EX', ttlSec);
  } catch {}
  return val;
}
