import { useEffect, useState } from 'react';
import { ATPGroup, MatrixSnapshot, Tactic, Technique } from '../types';
import { MATRIX_ENDPOINT } from '../constants';
import { tactics as bundledTactics, techniques as bundledTechniques, atpGroups as bundledGroups } from '../data';

const BUNDLED: MatrixSnapshot = {
  version: 'bundled',
  fetchedAt: '',
  tactics: bundledTactics,
  techniques: bundledTechniques,
  groups: bundledGroups,
  isFallback: true,
};

// A group counts as recently active when MITRE touched its entry within this window.
const RECENT_DAYS = 365;

function isPlausible(payload: unknown): payload is Omit<MatrixSnapshot, 'isFallback'> {
  if (typeof payload !== 'object' || payload === null) return false;
  const raw = payload as Record<string, unknown>;
  return (
    typeof raw.version === 'string' &&
    Array.isArray(raw.tactics) &&
    raw.tactics.length > 0 &&
    Array.isArray(raw.techniques) &&
    raw.techniques.length > 0 &&
    Array.isArray(raw.groups)
  );
}

function normalize(payload: Omit<MatrixSnapshot, 'isFallback'>): MatrixSnapshot {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  const tactics: Tactic[] = payload.tactics.map(tactic => ({
    id: tactic.id,
    name: tactic.name,
    shortName: tactic.shortName || tactic.name,
    order: tactic.order,
  }));

  const techniques: Technique[] = payload.techniques.map(technique => ({
    id: technique.id,
    name: technique.name,
    tacticId: technique.tacticId,
    description: technique.description ?? '',
    ...(technique.id.includes('.') ? { isSubTechnique: true, parentId: technique.id.split('.')[0] } : {}),
  }));

  const groups: ATPGroup[] = payload.groups.map(group => {
    const modified = group.modified ?? '';
    const timestamp = modified ? Date.parse(modified) : NaN;
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? '',
      techniques: group.techniques ?? [],
      aliases: group.aliases ?? [],
      modified,
      active: Number.isNaN(timestamp) ? true : timestamp >= cutoff,
    };
  });

  return { version: payload.version, fetchedAt: payload.fetchedAt ?? '', tactics, techniques, groups, isFallback: false };
}

export function useMatrix(): { matrix: MatrixSnapshot; loading: boolean; fallbackReason: string | null } {
  const [matrix, setMatrix] = useState<MatrixSnapshot>(BUNDLED);
  const [loading, setLoading] = useState(true);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatrix() {
      try {
        const branch = new URLSearchParams(window.location.search).get('branch');
        const url = branch ? `${MATRIX_ENDPOINT}?branch=${encodeURIComponent(branch)}` : MATRIX_ENDPOINT;

        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
          throw new Error(`ATT&CK matrix request failed: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();
        if (!isPlausible(payload)) {
          throw new Error('ATT&CK matrix response was missing tactics or techniques');
        }

        setMatrix(normalize(payload));
        setFallbackReason(null);
      } catch (error) {
        setMatrix(BUNDLED);
        setFallbackReason(error instanceof Error ? error.message : 'ATT&CK matrix could not be loaded');
      } finally {
        setLoading(false);
      }
    }

    fetchMatrix();
  }, []);

  return { matrix, loading, fallbackReason };
}
