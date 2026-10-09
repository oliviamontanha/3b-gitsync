import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import Heatmap from './components/Heatmap';
import { industryStandards } from './data';
import { FilterState } from './types';
import { buildThreatIntelScope, calculateCoverageStats } from './utils';
import { useDetections } from './hooks/useDetections';
import { useMatrix } from './hooks/useMatrix';
import { loadFilterState, reconcileSelections, saveFilterState, syncUrl } from './filterState';

export default function App() {
  const [filterState, setFilterState] = useState<FilterState>(loadFilterState);

  useEffect(() => {
    saveFilterState(filterState);
    syncUrl(filterState);
  }, [filterState]);

  const { matrix, loading: matrixLoading, fallbackReason } = useMatrix();
  const { data: detectionCoverage, loading, error, recalculateWithThresholds, totalRecords } = useDetections();

  useEffect(() => {
    if (matrixLoading) return;
    const standardIds = industryStandards.map(standard => standard.id);
    const groupIds = matrix.groups.map(group => group.id);
    setFilterState(current => reconcileSelections(current, standardIds, groupIds));
  }, [matrixLoading, matrix]);

  useEffect(() => {
    if (detectionCoverage.length > 0) {
      recalculateWithThresholds(filterState.thresholds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState.thresholds.low, filterState.thresholds.medium, filterState.thresholds.high]);

  const scope = useMemo(
    () => buildThreatIntelScope(matrix.techniques, filterState, industryStandards, matrix.groups),
    [matrix, filterState]
  );

  const stats = useMemo(() => {
    return calculateCoverageStats(
      matrix.techniques,
      filterState,
      industryStandards,
      matrix.groups,
      detectionCoverage,
      totalRecords,
      scope
    );
  }, [matrix, filterState, detectionCoverage, totalRecords, scope]);

  if (loading || matrixLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <title>MITRE ATT&CK Coverage Heatmap</title>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-sm text-slate-600">Loading ATT&CK matrix and detection coverage...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <title>MITRE ATT&CK Coverage Heatmap</title>
        <div className="bg-white rounded-lg border border-yellow-200 p-6 max-w-2xl">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Detection Records Issue</h3>
              <p className="text-sm text-slate-600 mb-3">{error}</p>

              <div className="text-xs text-slate-500 bg-slate-50 rounded p-3 mb-3">
                <div className="font-semibold mb-2">Required Record Fields:</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="font-medium text-slate-700 mb-1">Field Names (any case):</div>
                    <ul className="space-y-0.5">
                      <li>• <code className="bg-white px-1 py-0.5 rounded">Name</code> or <code className="bg-white px-1 py-0.5 rounded">name</code></li>
                      <li>• <code className="bg-white px-1 py-0.5 rounded">Source</code> or <code className="bg-white px-1 py-0.5 rounded">source</code></li>
                      <li>• <code className="bg-white px-1 py-0.5 rounded">Techniques</code> or <code className="bg-white px-1 py-0.5 rounded">techniques</code></li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700 mb-1">Example Records:</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-mono">
                      Name: "Phishing Detection"<br/>
                      Source: "Email Gateway"<br/>
                      Techniques: "T1566,T1566.001"
                    </div>
                  </div>
                </div>

                <div className="font-semibold mb-1">Troubleshooting:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open browser console (F12) to see detailed logs</li>
                  <li>Check that field names match exactly (case-insensitive)</li>
                  <li>Ensure Techniques field contains comma-separated IDs</li>
                  <li>Verify Source field is not empty</li>
                </ol>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="h-8 px-4 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <title>MITRE ATT&CK Coverage Heatmap</title>
      <Header stats={stats} matrix={matrix} fallbackReason={fallbackReason} />
      <FilterPanel
        filterState={filterState}
        onFilterChange={setFilterState}
        standards={industryStandards}
        atpGroups={matrix.groups}
      />
      <Heatmap
        tactics={matrix.tactics}
        techniques={matrix.techniques}
        filterState={filterState}
        standards={industryStandards}
        atpGroups={matrix.groups}
        detectionCoverage={detectionCoverage}
        scope={scope}
      />
    </div>
  );
}
