import { fetchDetections, type Detection } from './tinesRecords';

const CACHE_PATH = '/storage/detections/detections.json';

interface Payload {
  records: Detection[];
  count: number;
  refreshed_at: string | null;
  source: 'cache' | 'live';
}

async function readCache(): Promise<Payload | null> {
  const file = Bun.file(CACHE_PATH);
  if (!(await file.exists())) return null;

  const cached = (await file.json()) as { records?: Detection[]; refreshed_at?: string };
  if (!cached.records?.length) return null;

  return {
    records: cached.records,
    count: cached.records.length,
    refreshed_at: cached.refreshed_at ?? null,
    source: 'cache',
  };
}

let payload = await readCache();

if (!payload) {
  console.error('Cache miss — fetching detections live from Tines Records');
  const records = await fetchDetections();
  if (records.length === 0) throw new Error('Tines returned no detection records');
  payload = { records, count: records.length, refreshed_at: new Date().toISOString(), source: 'live' };
}

const body = JSON.stringify(payload);

process.stdout.write(
  [
    'HTTP/1.1 200 OK',
    'Content-Type: application/json',
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Cache-Control: no-store',
    '',
    body,
  ].join('\r\n')
);
