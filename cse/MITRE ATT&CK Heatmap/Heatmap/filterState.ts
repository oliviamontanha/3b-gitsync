import { FilterState } from './types';
import { LEGACY_GROUP_IDS } from './constants';

const STORAGE_KEY = 'mitre-heatmap-filters';

const COLOR_SCHEMES: FilterState['colorScheme'][] = ['indigo', 'blue', 'purple', 'green', 'cyan', 'red', 'custom'];
const HIGHLIGHT_MODES: FilterState['highlightMode'][] = ['coverage', 'gaps', 'both'];
const COVERAGE_LEVELS: FilterState['coverageLevels'] = ['none', 'low', 'medium', 'high'];

const ID_PATTERN = /^[A-Za-z0-9._-]{1,32}$/;

export const DEFAULT_FILTER_STATE: FilterState = {
  showOrgDetections: true,
  selectedStandards: [],
  selectedATPs: [],
  highlightMode: 'both',
  searchQuery: '',
  selectedDataSources: [],
  coverageLevels: ['none', 'low', 'medium', 'high'],
  showSubTechniques: true,
  onlyRecentGroups: false,
  thresholds: {
    low: 1,
    medium: 2,
    high: 3
  },
  colorScheme: 'indigo',
  customColors: {
    low: '#C7D2FE',
    medium: '#818CF8',
    high: '#4F46E5'
  }
};

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function pickList(raw: string, allowed: readonly string[]): string[] {
  const seen = new Set<string>();
  return raw
    .split(',')
    .map(v => v.trim())
    .filter(v => allowed.includes(v) && !seen.has(v) && (seen.add(v), true));
}

// Selection ids are validated for shape here and reconciled against the loaded
// ATT&CK snapshot later, since the group catalogue isn't known until it arrives.
function pickIds(raw: string, mapLegacy: boolean): string[] {
  const seen = new Set<string>();
  return raw
    .split(',')
    .map(v => v.trim())
    .map(v => (mapLegacy ? LEGACY_GROUP_IDS[v] ?? v : v))
    .filter(v => ID_PATTERN.test(v) && !seen.has(v) && (seen.add(v), true));
}

export function reconcileSelections(
  state: FilterState,
  standardIds: readonly string[],
  groupIds: readonly string[]
): FilterState {
  const standards = state.selectedStandards.filter(id => standardIds.includes(id));
  const groups = state.selectedATPs.filter(id => groupIds.includes(id));

  if (sameList(standards, state.selectedStandards) && sameList(groups, state.selectedATPs)) {
    return state;
  }

  return { ...state, selectedStandards: standards, selectedATPs: groups };
}

function threshold(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 99) return null;
  return n;
}

function validThresholds(low: unknown, medium: unknown, high: unknown): FilterState['thresholds'] | null {
  const l = threshold(low);
  const m = threshold(medium);
  const h = threshold(high);
  if (l === null || m === null || h === null) return null;
  if (!(l <= m && m <= h)) return null;
  return { low: l, medium: m, high: h };
}

export function encodeFilterState(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  const d = DEFAULT_FILTER_STATE;

  if (state.showOrgDetections !== d.showOrgDetections) params.set('org', state.showOrgDetections ? '1' : '0');
  if (state.showSubTechniques !== d.showSubTechniques) params.set('sub', state.showSubTechniques ? '1' : '0');
  if (state.onlyRecentGroups !== d.onlyRecentGroups) params.set('recent', state.onlyRecentGroups ? '1' : '0');
  if (state.highlightMode !== d.highlightMode) params.set('mode', state.highlightMode);
  if (state.searchQuery !== d.searchQuery) params.set('q', state.searchQuery);
  if (!sameList(state.selectedStandards, d.selectedStandards)) params.set('std', state.selectedStandards.join(','));
  if (!sameList(state.selectedATPs, d.selectedATPs)) params.set('atp', state.selectedATPs.join(','));
  if (!sameList(state.selectedDataSources, d.selectedDataSources)) params.set('src', state.selectedDataSources.join(','));
  if (!sameList(state.coverageLevels, d.coverageLevels)) params.set('lvl', state.coverageLevels.join(','));

  const t = state.thresholds;
  if (t.low !== d.thresholds.low || t.medium !== d.thresholds.medium || t.high !== d.thresholds.high) {
    params.set('th', `${t.low}-${t.medium}-${t.high}`);
  }

  if (state.colorScheme !== d.colorScheme) params.set('cs', state.colorScheme);

  const c = state.customColors;
  if (c.low !== d.customColors.low || c.medium !== d.customColors.medium || c.high !== d.customColors.high) {
    params.set('cc', [c.low, c.medium, c.high].map(v => v.replace('#', '')).join('-'));
  }

  return params;
}

export function decodeFilterState(search: string): Partial<FilterState> {
  const params = new URLSearchParams(search);
  const out: Partial<FilterState> = {};

  const org = params.get('org');
  if (org === '1' || org === '0') out.showOrgDetections = org === '1';

  const sub = params.get('sub');
  if (sub === '1' || sub === '0') out.showSubTechniques = sub === '1';

  const recent = params.get('recent');
  if (recent === '1' || recent === '0') out.onlyRecentGroups = recent === '1';

  const mode = params.get('mode');
  if (mode && (HIGHLIGHT_MODES as string[]).includes(mode)) out.highlightMode = mode as FilterState['highlightMode'];

  const q = params.get('q');
  if (q !== null) out.searchQuery = q.slice(0, 200);

  const std = params.get('std');
  if (std !== null) out.selectedStandards = pickIds(std, false);

  const atp = params.get('atp');
  if (atp !== null) out.selectedATPs = pickIds(atp, true);

  const src = params.get('src');
  if (src !== null) {
    out.selectedDataSources = src
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0 && v.length <= 100);
  }

  const lvl = params.get('lvl');
  if (lvl !== null) out.coverageLevels = pickList(lvl, COVERAGE_LEVELS) as FilterState['coverageLevels'];

  const th = params.get('th');
  if (th !== null) {
    const [low, medium, high] = th.split('-');
    const parsed = validThresholds(low, medium, high);
    if (parsed) out.thresholds = parsed;
  }

  const cs = params.get('cs');
  if (cs && (COLOR_SCHEMES as string[]).includes(cs)) out.colorScheme = cs as FilterState['colorScheme'];

  const cc = params.get('cc');
  if (cc !== null) {
    const parts = cc.split('-').map(v => `#${v}`);
    if (parts.length === 3 && parts.every(isHex)) {
      out.customColors = { low: parts[0], medium: parts[1], high: parts[2] };
    }
  }

  return out;
}

function validateStored(value: unknown): Partial<FilterState> {
  if (typeof value !== 'object' || value === null) return {};
  const raw = value as Record<string, unknown>;
  const out: Partial<FilterState> = {};

  if (typeof raw.showOrgDetections === 'boolean') out.showOrgDetections = raw.showOrgDetections;
  if (typeof raw.showSubTechniques === 'boolean') out.showSubTechniques = raw.showSubTechniques;
  if (typeof raw.onlyRecentGroups === 'boolean') out.onlyRecentGroups = raw.onlyRecentGroups;
  if (typeof raw.highlightMode === 'string' && (HIGHLIGHT_MODES as string[]).includes(raw.highlightMode)) {
    out.highlightMode = raw.highlightMode as FilterState['highlightMode'];
  }
  if (typeof raw.searchQuery === 'string') out.searchQuery = raw.searchQuery.slice(0, 200);
  if (Array.isArray(raw.selectedStandards)) {
    out.selectedStandards = pickIds(raw.selectedStandards.join(','), false);
  }
  if (Array.isArray(raw.selectedATPs)) {
    out.selectedATPs = pickIds(raw.selectedATPs.join(','), true);
  }
  if (Array.isArray(raw.selectedDataSources)) {
    out.selectedDataSources = raw.selectedDataSources.filter(
      (v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 100
    );
  }
  if (Array.isArray(raw.coverageLevels)) {
    out.coverageLevels = pickList(raw.coverageLevels.join(','), COVERAGE_LEVELS) as FilterState['coverageLevels'];
  }
  if (typeof raw.thresholds === 'object' && raw.thresholds !== null) {
    const t = raw.thresholds as Record<string, unknown>;
    const parsed = validThresholds(t.low, t.medium, t.high);
    if (parsed) out.thresholds = parsed;
  }
  if (typeof raw.colorScheme === 'string' && (COLOR_SCHEMES as string[]).includes(raw.colorScheme)) {
    out.colorScheme = raw.colorScheme as FilterState['colorScheme'];
  }
  if (typeof raw.customColors === 'object' && raw.customColors !== null) {
    const c = raw.customColors as Record<string, unknown>;
    const parts = [c.low, c.medium, c.high];
    if (parts.every((v): v is string => typeof v === 'string' && isHex(v))) {
      out.customColors = { low: parts[0] as string, medium: parts[1] as string, high: parts[2] as string };
    }
  }

  return out;
}

export function loadFilterState(): FilterState {
  if (typeof window === 'undefined') return DEFAULT_FILTER_STATE;

  let stored: Partial<FilterState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) stored = validateStored(JSON.parse(raw));
  } catch {
    stored = {};
  }

  return { ...DEFAULT_FILTER_STATE, ...stored, ...decodeFilterState(window.location.search) };
}

export function saveFilterState(state: FilterState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full quota just means preferences don't stick.
  }
}

const PRESERVED_PARAMS = ['branch', 'external_id'];

export function syncUrl(state: FilterState): void {
  const current = new URLSearchParams(window.location.search);
  const next = encodeFilterState(state);
  for (const key of PRESERVED_PARAMS) {
    const value = current.get(key);
    if (value !== null) next.set(key, value);
  }
  const query = next.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}
