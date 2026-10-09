import { DetectionCoverage, Technique, IndustryStandard, ATPGroup, FilterState } from './types';

export function getCoverageLevel(
  techniqueId: string,
  filterState: FilterState,
  standards: IndustryStandard[],
  atpGroups: ATPGroup[],
  detectionCoverage: DetectionCoverage[]
): { level: number; sources: string[]; reasons: string[]; detections: Array<{ name: string; source: string }> } {
  const reasons: string[] = [];
  let maxLevel = 0;
  let allSources: string[] = [];
  let allDetections: Array<{ name: string; source: string }> = [];

  if (filterState.showOrgDetections) {
    const orgCoverage = detectionCoverage.find(c => c.techniqueId === techniqueId);
    if (orgCoverage) {
      maxLevel = Math.max(maxLevel, orgCoverage.level);
      allSources = [...allSources, ...orgCoverage.sources];
      allDetections = [...allDetections, ...orgCoverage.detections];
      if (orgCoverage.level > 0) {
        reasons.push(`Org Coverage: ${getLevelName(orgCoverage.level)}`);
      }
    }

    if (!techniqueId.includes('.')) {
      const subTechniqueCoverage = detectionCoverage.filter(c =>
        c.techniqueId.startsWith(techniqueId + '.') && c.level > 0
      );

      if (subTechniqueCoverage.length > 0) {
        subTechniqueCoverage.forEach(subCov => {
          maxLevel = Math.max(maxLevel, subCov.level);
          allSources = [...allSources, ...subCov.sources];
          allDetections = [...allDetections, ...subCov.detections];
        });

        if (!orgCoverage) {
          reasons.push(`Coverage via ${subTechniqueCoverage.length} sub-technique${subTechniqueCoverage.length > 1 ? 's' : ''}`);
        }
      }
    }
  } else {
    maxLevel = 0;
    allSources = [];
    allDetections = [];
  }

  return {
    level: maxLevel,
    sources: [...new Set(allSources)],
    reasons,
    detections: allDetections
  };
}

export function getLevelName(level: number): string {
  switch (level) {
    case 0: return 'None';
    case 1: return 'Low';
    case 2: return 'Medium';
    case 3: return 'High';
    default: return 'Unknown';
  }
}

export function getLevelColor(level: number, highlightMode: string, colorScheme: string = 'indigo', customColors?: { low: string; medium: string; high: string }): string {
  if (highlightMode === 'gaps' && level === 0) {
    return 'bg-red-100 border-red-300 text-red-900';
  }
  if (highlightMode === 'coverage' && level === 0) {
    return 'bg-slate-50 border-slate-200 text-slate-400';
  }

  if (colorScheme === 'custom' && customColors) {
    switch (level) {
      case 0: return 'bg-slate-100 border-slate-200 text-slate-500';
      case 1: return `CUSTOM:${customColors.low}`;
      case 2: return `CUSTOM:${customColors.medium}`;
      case 3: return `CUSTOM:${customColors.high}`;
      default: return 'bg-slate-100 border-slate-200 text-slate-500';
    }
  }

  const colorMap: Record<string, { low: string; medium: string; high: string }> = {
    indigo: {
      low: 'bg-indigo-200 border-indigo-300 text-indigo-900',
      medium: 'bg-indigo-400 border-indigo-500 text-white',
      high: 'bg-indigo-600 border-indigo-700 text-white'
    },
    blue: {
      low: 'bg-blue-200 border-blue-300 text-blue-900',
      medium: 'bg-blue-400 border-blue-500 text-white',
      high: 'bg-blue-600 border-blue-700 text-white'
    },
    purple: {
      low: 'bg-purple-200 border-purple-300 text-purple-900',
      medium: 'bg-purple-400 border-purple-500 text-white',
      high: 'bg-purple-600 border-purple-700 text-white'
    },
    green: {
      low: 'bg-green-200 border-green-300 text-green-900',
      medium: 'bg-green-400 border-green-500 text-white',
      high: 'bg-green-600 border-green-700 text-white'
    },
    cyan: {
      low: 'bg-cyan-200 border-cyan-300 text-cyan-900',
      medium: 'bg-cyan-400 border-cyan-500 text-white',
      high: 'bg-cyan-600 border-cyan-700 text-white'
    },
    red: {
      low: 'bg-red-200 border-red-300 text-red-900',
      medium: 'bg-red-400 border-red-500 text-white',
      high: 'bg-red-600 border-red-700 text-white'
    }
  };

  const colors = colorMap[colorScheme] || colorMap.indigo;

  switch (level) {
    case 0: return 'bg-slate-100 border-slate-200 text-slate-500';
    case 1: return colors.low;
    case 2: return colors.medium;
    case 3: return colors.high;
    default: return 'bg-slate-100 border-slate-200 text-slate-500';
  }
}

export function buildThreatIntelScope(
  techniques: Technique[],
  filterState: FilterState,
  standards: IndustryStandard[],
  atpGroups: ATPGroup[]
): Set<string> | null {
  const explicit = new Set<string>();

  standards
    .filter(standard => filterState.selectedStandards.includes(standard.id))
    .forEach(standard => standard.techniques.forEach(id => explicit.add(id)));

  atpGroups
    .filter(group => filterState.selectedATPs.includes(group.id))
    .forEach(group => group.techniques.forEach(id => explicit.add(id)));

  if (explicit.size === 0) return null;

  // A sub-technique pulls its parent into scope, and an explicitly listed parent
  // pulls its sub-techniques in — so selecting a group that only uses T1566.001
  // still lights up T1566, without inventing coverage for its siblings.
  const scope = new Set<string>();
  techniques.forEach(technique => {
    const parentId = technique.id.includes('.') ? technique.id.split('.')[0] : technique.id;
    if (explicit.has(technique.id)) {
      scope.add(technique.id);
      scope.add(parentId);
    } else if (explicit.has(parentId)) {
      scope.add(technique.id);
    }
  });

  return scope;
}

export function calculateCoverageStats(
  techniques: Technique[],
  filterState: FilterState,
  standards: IndustryStandard[],
  atpGroups: ATPGroup[],
  detectionCoverage: DetectionCoverage[],
  totalRecords: number,
  scope: Set<string> | null = null
) {
  const stats = {
    total: 0,
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    percentage: 0,
    covered: 0,
    totalDetections: totalRecords,
    parentTechniques: 0,
    subTechniques: 0,
    scoped: scope !== null
  };

  const uniqueTechniquesMap = new Map<string, Technique>();
  techniques.forEach(technique => {
    if (!uniqueTechniquesMap.has(technique.id)) {
      uniqueTechniquesMap.set(technique.id, technique);
    }
  });

  const uniqueTechniques = Array.from(uniqueTechniquesMap.values()).filter(
    technique => scope === null || scope.has(technique.id)
  );

  const parentTechniques = uniqueTechniques.filter(t => !t.id.includes('.'));
  const subTechniques = uniqueTechniques.filter(t => t.id.includes('.'));

  stats.parentTechniques = parentTechniques.length;
  stats.subTechniques = subTechniques.length;

  const techniquesToCount = filterState.showSubTechniques
    ? uniqueTechniques
    : parentTechniques;

  stats.total = techniquesToCount.length;

  techniquesToCount.forEach(technique => {
    const coverage = getCoverageLevel(technique.id, filterState, standards, atpGroups, detectionCoverage);
    switch (coverage.level) {
      case 0: stats.none++; break;
      case 1: stats.low++; break;
      case 2: stats.medium++; break;
      case 3: stats.high++; break;
    }
  });

  stats.covered = stats.low + stats.medium + stats.high;
  stats.percentage = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0;

  return stats;
}

export function getTextColorForBackground(hexColor: string): string {
  const hex = hexColor.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#0D0D0D' : '#FFFFFF';
}

export function darkenColor(hexColor: string, amount: number = 20): string {
  const hex = hexColor.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
