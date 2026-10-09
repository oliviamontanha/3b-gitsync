import { fetchDetections } from './tinesRecords';

const CACHE_PATH = '/storage/detections/detections.json';

const detections = await fetchDetections();

if (detections.length === 0) {
  throw new Error('Tines returned no detection records — refusing to overwrite the cache with an empty set');
}

const payload = {
  records: detections,
  count: detections.length,
  refreshed_at: new Date().toISOString(),
};

await Bun.write(CACHE_PATH, JSON.stringify(payload));

console.error(`Cached ${detections.length} detections`);
process.stdout.write(JSON.stringify({ count: detections.length, refreshed_at: payload.refreshed_at }));
