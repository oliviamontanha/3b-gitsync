import { rename } from 'node:fs/promises';

const BUNDLE_URL =
  'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json';
const VOLUME = '/storage/attack_matrix';
const TARGET = `${VOLUME}/matrix.json`;

const MIN_TACTICS = 12;
const MIN_TECHNIQUES = 200;
const MIN_GROUPS = 50;

// MITRE renames tactics between releases, so the column abbreviation is keyed by
// the stable TA id and falls back to the live name.
const SHORT_NAMES: Record<string, string> = {
  TA0043: 'Recon',
  TA0042: 'Resource',
  TA0001: 'Initial',
  TA0002: 'Execute',
  TA0003: 'Persist',
  TA0004: 'Priv Esc',
  TA0005: 'Stealth',
  TA0112: 'Defense',
  TA0006: 'Creds',
  TA0007: 'Discover',
  TA0008: 'Lateral',
  TA0009: 'Collect',
  TA0011: 'C2',
  TA0010: 'Exfil',
  TA0040: 'Impact',
};

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  aliases?: string[];
  modified?: string;
  revoked?: boolean;
  x_mitre_deprecated?: boolean;
  x_mitre_domains?: string[];
  x_mitre_shortname?: string;
  x_mitre_is_subtechnique?: boolean;
  x_mitre_version?: string;
  tactic_refs?: string[];
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  external_references?: Array<{ source_name: string; external_id?: string; url?: string }>;
  relationship_type?: string;
  source_ref?: string;
  target_ref?: string;
}

function attackId(object: StixObject): string {
  return object.external_references?.find(ref => ref.source_name === 'mitre-attack')?.external_id ?? '';
}

function isCurrent(object: StixObject): boolean {
  return !object.revoked && !object.x_mitre_deprecated;
}

function summarize(text: string | undefined, limit: number): string {
  if (!text) return '';
  return text
    .split('\n')[0]
    .replace(/\(Citation:[^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

const response = await fetch(BUNDLE_URL);
if (!response.ok) {
  throw new Error(`MITRE bundle fetch failed: ${response.status} ${response.statusText}`);
}
const objects: StixObject[] = (await response.json()).objects;

const collection = objects.find(object => object.type === 'x-mitre-collection');
const version = collection?.x_mitre_version ?? 'unknown';

const matrix = objects.find(object => object.type === 'x-mitre-matrix');
if (!matrix?.tactic_refs) {
  throw new Error('MITRE bundle contains no x-mitre-matrix with tactic_refs');
}
const columnOrder = new Map(matrix.tactic_refs.map((ref, index) => [ref, index + 1]));

const shortNameToTacticId = new Map<string, string>();
const tactics = [];
for (const object of objects) {
  if (object.type !== 'x-mitre-tactic' || !isCurrent(object)) continue;
  const id = attackId(object);
  const order = columnOrder.get(object.id);
  if (!id || order === undefined) continue;
  if (object.x_mitre_shortname) shortNameToTacticId.set(object.x_mitre_shortname, id);
  tactics.push({ id, name: object.name ?? id, shortName: SHORT_NAMES[id] ?? object.name ?? id, order });
}
tactics.sort((a, b) => a.order - b.order);

const stixToAttackId = new Map<string, string>();
const techniques = [];
const techniqueIds = new Set<string>();
for (const object of objects) {
  if (object.type !== 'attack-pattern' || !isCurrent(object)) continue;
  if (object.x_mitre_domains && !object.x_mitre_domains.includes('enterprise-attack')) continue;
  const id = attackId(object);
  if (!id) continue;
  stixToAttackId.set(object.id, id);
  techniqueIds.add(id);

  const description = summarize(object.description, 300);
  const phases = (object.kill_chain_phases ?? []).filter(phase => phase.kill_chain_name === 'mitre-attack');
  for (const phase of phases) {
    const tacticId = shortNameToTacticId.get(phase.phase_name);
    if (!tacticId) continue;
    techniques.push({
      id,
      name: object.name ?? id,
      tacticId,
      description,
      ...(object.x_mitre_is_subtechnique ? { isSubTechnique: true, parentId: id.split('.')[0] } : {}),
    });
  }
}

const techniquesByGroup = new Map<string, Set<string>>();
for (const object of objects) {
  if (object.type !== 'relationship' || object.relationship_type !== 'uses' || object.revoked) continue;
  if (!object.source_ref?.startsWith('intrusion-set--') || !object.target_ref) continue;
  const techniqueId = stixToAttackId.get(object.target_ref);
  if (!techniqueId) continue;
  let used = techniquesByGroup.get(object.source_ref);
  if (!used) {
    used = new Set();
    techniquesByGroup.set(object.source_ref, used);
  }
  used.add(techniqueId);
}

const groups = objects
  .filter(object => object.type === 'intrusion-set' && isCurrent(object))
  .map(object => {
    const id = attackId(object);
    const used = [...(techniquesByGroup.get(object.id) ?? [])].sort();
    const name = object.name ?? id;
    return {
      id,
      name,
      aliases: (object.aliases ?? []).filter(alias => alias !== name),
      description: summarize(object.description, 300),
      techniques: used,
      modified: object.modified?.slice(0, 10) ?? '',
    };
  })
  .filter(group => group.id.length > 0 && group.techniques.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

if (tactics.length < MIN_TACTICS || techniqueIds.size < MIN_TECHNIQUES || groups.length < MIN_GROUPS) {
  throw new Error(
    `MITRE bundle failed sanity check: ${tactics.length} tactics, ${techniqueIds.size} techniques, ${groups.length} groups`,
  );
}

const payload = {
  version,
  fetchedAt: new Date().toISOString(),
  tactics,
  techniques,
  groups,
};

const body = JSON.stringify(payload);
const temporary = `${TARGET}.${process.pid}.tmp`;
await Bun.write(temporary, body);
await rename(temporary, TARGET);

const subTechniques = new Set(techniques.filter(technique => technique.isSubTechnique).map(t => t.id)).size;
console.error(
  `ATT&CK v${version}: ${tactics.length} tactics, ${techniqueIds.size} techniques ` +
    `(${techniqueIds.size - subTechniques} parent + ${subTechniques} sub), ${groups.length} groups, ${body.length} bytes`,
);

process.stdout.write(
  JSON.stringify({
    version,
    fetchedAt: payload.fetchedAt,
    tactics: tactics.length,
    techniques: techniqueIds.size,
    subTechniques,
    groups: groups.length,
    bytes: body.length,
  }),
);
