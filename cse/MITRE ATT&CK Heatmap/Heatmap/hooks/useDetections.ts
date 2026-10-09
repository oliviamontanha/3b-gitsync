import { useState, useEffect, useCallback } from 'react';
import { DetectionCoverage } from '../types';
import { DETECTIONS_ENDPOINT } from '../constants';

interface DetectionRecord {
  name?: string;
  Name?: string;
  source?: string;
  Source?: string;
  techniques?: string;
  Techniques?: string;
  technique?: string;
  detection_source?: string;
  tool?: string;
  [key: string]: any;
}

interface UseDetectionsResult {
  data: DetectionCoverage[];
  loading: boolean;
  error: string | null;
  recalculateWithThresholds: (thresholds: { low: number; medium: number; high: number }) => DetectionCoverage[];
  totalRecords: number;
}

function calculateLevel(detectionCount: number, thresholds: { low: number; medium: number; high: number }): 0 | 1 | 2 | 3 {
  if (detectionCount === 0) {
    return 0;
  } else if (detectionCount < thresholds.medium) {
    return 1;
  } else if (detectionCount < thresholds.high) {
    return 2;
  } else {
    return 3;
  }
}

function processRecords(
  records: DetectionRecord[],
  thresholds: { low: number; medium: number; high: number }
): { coverage: DetectionCoverage[]; coverageMap: Map<string, Set<string>>; detectionsMap: Map<string, Array<{ name: string; source: string }>> } {
  const coverageMap = new Map<string, Set<string>>();
  const detectionsMap = new Map<string, Array<{ name: string; source: string }>>();

  records.forEach(record => {
    const techniques = record.techniques || record.Techniques || record.technique;
    const source = record.source || record.Source || record.detection_source || record.tool;
    const name = record.name || record.Name || 'Unnamed Detection';

    if (!techniques || !source) return;

    const techniqueList = techniques
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const normalizedSource = source.trim();

    techniqueList.forEach(techniqueId => {
      if (!coverageMap.has(techniqueId)) {
        coverageMap.set(techniqueId, new Set());
        detectionsMap.set(techniqueId, []);
      }
      coverageMap.get(techniqueId)!.add(normalizedSource);
      detectionsMap.get(techniqueId)!.push({ name, source: normalizedSource });
    });
  });

  const coverage = Array.from(coverageMap.entries()).map(([techniqueId, sourcesSet]) => {
    const sources = Array.from(sourcesSet).sort();
    const detections = detectionsMap.get(techniqueId) || [];
    return {
      techniqueId,
      level: calculateLevel(detections.length, thresholds),
      sources,
      detections
    };
  });

  return { coverage, coverageMap, detectionsMap };
}

export function useDetections(): UseDetectionsResult {
  const [data, setData] = useState<DetectionCoverage[]>([]);
  const [coverageMap, setCoverageMap] = useState<Map<string, Set<string>>>(new Map());
  const [detectionsMap, setDetectionsMap] = useState<Map<string, Array<{ name: string; source: string }>>>(new Map());
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recalculateWithThresholds = useCallback((thresholds: { low: number; medium: number; high: number }) => {
    const recalculated = Array.from(coverageMap.entries()).map(([techniqueId, sourcesSet]) => {
      const sources = Array.from(sourcesSet).sort();
      const detections = detectionsMap.get(techniqueId) || [];
      return {
        techniqueId,
        level: calculateLevel(detections.length, thresholds),
        sources,
        detections
      };
    });

    setData(recalculated);
    return recalculated;
  }, [coverageMap, detectionsMap]);

  useEffect(() => {
    async function fetchRecords() {
      try {
        setLoading(true);
        setError(null);

        const branch = new URLSearchParams(window.location.search).get('branch');
        const url = branch ? `${DETECTIONS_ENDPOINT}?branch=${encodeURIComponent(branch)}` : DETECTIONS_ENDPOINT;

        const response = await fetch(url, { headers: { Accept: 'application/json' } });

        if (!response.ok) {
          throw new Error(`Failed to fetch detections: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();
        const records: DetectionRecord[] = payload.records || [];

        if (records.length === 0) {
          setData([]);
          setCoverageMap(new Map());
          setDetectionsMap(new Map());
          setTotalRecords(0);
          setError('No detection records found.');
          return;
        }

        const defaultThresholds = { low: 1, medium: 2, high: 3 };
        const { coverage, coverageMap: newCoverageMap, detectionsMap: newDetectionsMap } = processRecords(records, defaultThresholds);

        if (coverage.length === 0) {
          setError(`Found ${records.length} records but no valid detection data. Please ensure records have "Name", "Source", and "Techniques" fields.`);
          setData([]);
          setCoverageMap(new Map());
          setDetectionsMap(new Map());
          setTotalRecords(0);
          return;
        }

        setData(coverage);
        setCoverageMap(newCoverageMap);
        setDetectionsMap(newDetectionsMap);
        setTotalRecords(records.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch detection data';
        setError(errorMessage);
        setData([]);
        setCoverageMap(new Map());
        setDetectionsMap(new Map());
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, []);

  return { data, loading, error, recalculateWithThresholds, totalRecords };
}
