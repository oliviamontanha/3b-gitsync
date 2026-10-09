import { useState } from 'react';
import { Tactic, Technique, FilterState, IndustryStandard, ATPGroup, DetectionCoverage } from '../types';
import TechniqueCell from './TechniqueCell';
import { getCoverageLevel } from '../utils';

interface HeatmapProps {
  tactics: Tactic[];
  techniques: Technique[];
  filterState: FilterState;
  standards: IndustryStandard[];
  atpGroups: ATPGroup[];
  detectionCoverage: DetectionCoverage[];
  scope: Set<string> | null;
}

function organizeTechniques(allTechniques: Technique[], tacticId: string) {
  const tacticTechniques = allTechniques.filter(t => t.tacticId === tacticId);
  const parents: Technique[] = [];
  const childrenMap = new Map<string, Technique[]>();

  tacticTechniques.forEach(tech => {
    const isSubTechnique = tech.id.includes('.');
    if (isSubTechnique) {
      const parentId = tech.id.split('.')[0];
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(tech);
    } else {
      parents.push(tech);
    }
  });

  return { parents, childrenMap };
}

export default function Heatmap({ tactics, techniques, filterState, standards, atpGroups, detectionCoverage, scope }: HeatmapProps) {
  const sortedTactics = [...tactics].sort((a, b) => a.order - b.order);
  const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());

  const inScope = (techniqueId: string) => scope === null || scope.has(techniqueId);

  const searchLower = filterState.searchQuery.toLowerCase().trim();
  const matchesSearch = (technique: Technique) => {
    if (!searchLower) return true;
    return (
      technique.id.toLowerCase().includes(searchLower) ||
      technique.name.toLowerCase().includes(searchLower) ||
      technique.description.toLowerCase().includes(searchLower)
    );
  };

  const matchesDataSource = (technique: Technique) => {
    if (filterState.selectedDataSources.length === 0) return true;
    const coverage = detectionCoverage.find(c => c.techniqueId === technique.id);
    if (!coverage || coverage.sources.length === 0) return false;
    return coverage.sources.some(source => filterState.selectedDataSources.includes(source));
  };

  const getMatchedStandards = (techniqueId: string): string[] => {
    if (filterState.selectedStandards.length === 0) return [];
    return standards
      .filter(s => filterState.selectedStandards.includes(s.id) && s.techniques.includes(techniqueId))
      .map(s => s.name);
  };

  const getMatchedATPs = (techniqueId: string): string[] => {
    if (filterState.selectedATPs.length === 0) return [];
    return atpGroups
      .filter(a => filterState.selectedATPs.includes(a.id) && a.techniques.includes(techniqueId))
      .map(a => a.name);
  };

  const calculateTacticCoverage = (tacticId: string) => {
    const tacticTechniques = techniques.filter(
      t => t.tacticId === tacticId && !t.id.includes('.') && inScope(t.id)
    );
    const totalCount = tacticTechniques.length;
    const coveredCount = tacticTechniques.filter(t => {
      const parentCoverage = detectionCoverage.find(c => c.techniqueId === t.id);
      if (parentCoverage && parentCoverage.level > 0) {
        return true;
      }

      return detectionCoverage.some(c =>
        c.techniqueId.startsWith(t.id + '.') && c.level > 0
      );
    }).length;

    return {
      total: totalCount,
      covered: coveredCount,
      percentage: totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0
    };
  };

  const getCoverageLevelName = (level: number): 'none' | 'low' | 'medium' | 'high' => {
    switch (level) {
      case 0: return 'none';
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      default: return 'none';
    }
  };

  const toggleExpand = (techniqueId: string) => {
    const newExpanded = new Set(expandedTechniques);
    if (newExpanded.has(techniqueId)) {
      newExpanded.delete(techniqueId);
    } else {
      newExpanded.add(techniqueId);
    }
    setExpandedTechniques(newExpanded);
  };

  return (
    <div className="w-full px-3 py-4">
      <div className="mb-4 flex items-center justify-center gap-6">
        <div className="text-xs font-medium text-slate-600">Detection Coverage:</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-4 rounded bg-slate-100 border border-slate-200"></div>
            <span className="text-[10px] text-slate-600">None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={filterState.colorScheme === 'custom' ? 'w-8 h-4 rounded border' : `w-8 h-4 rounded bg-${filterState.colorScheme}-200 border border-${filterState.colorScheme}-300`}
              style={filterState.colorScheme === 'custom' ? {
                backgroundColor: filterState.customColors.low,
                borderColor: filterState.customColors.low
              } : undefined}
            ></div>
            <span className="text-[10px] text-slate-600">Low ({filterState.thresholds.low}+ detections)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={filterState.colorScheme === 'custom' ? 'w-8 h-4 rounded border' : `w-8 h-4 rounded bg-${filterState.colorScheme}-400 border border-${filterState.colorScheme}-500`}
              style={filterState.colorScheme === 'custom' ? {
                backgroundColor: filterState.customColors.medium,
                borderColor: filterState.customColors.medium
              } : undefined}
            ></div>
            <span className="text-[10px] text-slate-600">Medium ({filterState.thresholds.medium}+ detections)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={filterState.colorScheme === 'custom' ? 'w-8 h-4 rounded border' : `w-8 h-4 rounded bg-${filterState.colorScheme}-600 border border-${filterState.colorScheme}-700`}
              style={filterState.colorScheme === 'custom' ? {
                backgroundColor: filterState.customColors.high,
                borderColor: filterState.customColors.high
              } : undefined}
            ></div>
            <span className="text-[10px] text-slate-600">High ({filterState.thresholds.high}+ detections)</span>
          </div>
        </div>

        {(filterState.selectedStandards.length > 0 || filterState.selectedATPs.length > 0) && (
          <>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-3">
              {filterState.selectedStandards.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-slate-600">Required by Standard</span>
                </div>
              )}
              {filterState.selectedATPs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[10px] text-slate-600">Used by Threat Group</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 rounded bg-slate-100 border border-slate-200 opacity-40"></div>
                <span className="text-[10px] text-slate-600">Outside selection (excluded from stats)</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sortedTactics.length}, minmax(0, 1fr))` }}>
        {sortedTactics.map(tactic => {
          const { parents, childrenMap } = organizeTechniques(techniques, tactic.id);
          const filteredParents = parents.filter(t => matchesSearch(t) && matchesDataSource(t));
          const coverage = calculateTacticCoverage(tactic.id);

          return (
            <div key={tactic.id} className="flex flex-col min-w-0">
              <div className="bg-slate-900 text-white rounded-t p-2 mb-1.5 sticky top-0 z-10">
                <div className="text-[9px] font-medium text-slate-400 mb-0.5">{tactic.id}</div>
                <div className="text-[11px] font-semibold leading-tight mb-2">{tactic.name}</div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-400">{coverage.covered}/{coverage.total}</span>
                    <span className="text-slate-400 font-medium">{coverage.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={filterState.colorScheme === 'custom' ? 'h-full rounded-full transition-all duration-300' : `h-full bg-${filterState.colorScheme}-500 rounded-full transition-all duration-300`}
                      style={{
                        width: `${coverage.percentage}%`,
                        ...(filterState.colorScheme === 'custom' ? { backgroundColor: filterState.customColors.medium } : {})
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {filteredParents.map(technique => {
                  const coverage = getCoverageLevel(technique.id, filterState, standards, atpGroups, detectionCoverage);
                  const levelName = getCoverageLevelName(coverage.level);
                  const matchedStandards = getMatchedStandards(technique.id);
                  const matchedATPs = getMatchedATPs(technique.id);
                  const subTechniques = childrenMap.get(technique.id) || [];
                  const hasSubTechniques = subTechniques.length > 0;
                  const isExpanded = expandedTechniques.has(technique.id);

                  if (!filterState.coverageLevels.includes(levelName)) {
                    return null;
                  }

                  const shouldShow =
                    filterState.highlightMode === 'both' ||
                    (filterState.highlightMode === 'coverage' && coverage.level > 0) ||
                    (filterState.highlightMode === 'gaps' && coverage.level === 0);

                  if (!shouldShow) {
                    return null;
                  }

                  return (
                    <div
                      key={technique.id}
                      className={inScope(technique.id) ? undefined : 'opacity-40'}
                      title={inScope(technique.id) ? undefined : 'Outside the selected threat-intel scope'}
                    >
                      <TechniqueCell
                        technique={technique}
                        level={coverage.level}
                        sources={coverage.sources}
                        reasons={coverage.reasons}
                        detections={coverage.detections}
                        highlightMode={filterState.highlightMode}
                        matchedStandards={matchedStandards}
                        matchedATPs={matchedATPs}
                        colorScheme={filterState.colorScheme}
                        customColors={filterState.customColors}
                        hasSubTechniques={hasSubTechniques}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleExpand(technique.id)}
                        showSubTechniques={filterState.showSubTechniques}
                      />

                      {filterState.showSubTechniques && isExpanded && hasSubTechniques && (
                        <div className="space-y-1.5 mt-1.5">
                          {subTechniques.filter(st => matchesSearch(st) && matchesDataSource(st)).map(subTech => {
                            const subCoverage = getCoverageLevel(subTech.id, filterState, standards, atpGroups, detectionCoverage);
                            const subLevelName = getCoverageLevelName(subCoverage.level);
                            const subMatchedStandards = getMatchedStandards(subTech.id);
                            const subMatchedATPs = getMatchedATPs(subTech.id);

                            if (!filterState.coverageLevels.includes(subLevelName)) {
                              return null;
                            }

                            const subShouldShow =
                              filterState.highlightMode === 'both' ||
                              (filterState.highlightMode === 'coverage' && subCoverage.level > 0) ||
                              (filterState.highlightMode === 'gaps' && subCoverage.level === 0);

                            if (!subShouldShow) {
                              return null;
                            }

                            return (
                              <div
                                key={subTech.id}
                                className={inScope(subTech.id) ? undefined : 'opacity-40'}
                                title={inScope(subTech.id) ? undefined : 'Outside the selected threat-intel scope'}
                              >
                                <TechniqueCell
                                  technique={subTech}
                                  level={subCoverage.level}
                                  sources={subCoverage.sources}
                                  reasons={subCoverage.reasons}
                                  detections={subCoverage.detections}
                                  highlightMode={filterState.highlightMode}
                                  matchedStandards={subMatchedStandards}
                                  matchedATPs={subMatchedATPs}
                                  colorScheme={filterState.colorScheme}
                                  customColors={filterState.customColors}
                                  showSubTechniques={filterState.showSubTechniques}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
