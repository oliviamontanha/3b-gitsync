export const RECORD_TYPE_ID = 55126;

const FIELD_IDS = [129265, 129266, 129267];
const PER_PAGE = 500;
const MAX_PAGES = 50;

export interface Detection {
  Name: string;
  Source: string;
  Techniques: string;
}

interface RecordResult {
  Name?: string;
  Source?: string;
  Techniques?: string;
}

async function getPage(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (response.status !== 429) return response;
    const wait = 500 * 2 ** attempt + Math.random() * 250;
    console.error(`Rate limited by Tines, retrying in ${Math.round(wait)}ms`);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  throw new Error('Tines Records API kept returning 429 after 5 attempts');
}

export async function fetchDetections(): Promise<Detection[]> {
  const base = process.env.TINES_URL;
  if (!base) throw new Error('TINES_URL is not set — is the Tines connector attached?');

  const params = new URLSearchParams({
    record_type_id: String(RECORD_TYPE_ID),
    per_page: String(PER_PAGE),
  });
  for (const id of FIELD_IDS) params.append('record_field_ids[]', String(id));

  let url: string | null = `${base.replace(/\/$/, '')}/api/v1/records?${params}`;
  const detections: Detection[] = [];

  for (let page = 0; url && page < MAX_PAGES; page++) {
    const response = await getPage(url);
    if (!response.ok) {
      throw new Error(`Tines Records API returned ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      record_results?: RecordResult[];
      meta?: { next_page?: string | null };
    };

    for (const record of payload.record_results ?? []) {
      detections.push({
        Name: record.Name ?? '',
        Source: record.Source ?? '',
        Techniques: record.Techniques ?? '',
      });
    }

    url = payload.meta?.next_page ?? null;
  }

  if (url) throw new Error(`Stopped after ${MAX_PAGES} pages — more records remain than expected`);

  return detections;
}
