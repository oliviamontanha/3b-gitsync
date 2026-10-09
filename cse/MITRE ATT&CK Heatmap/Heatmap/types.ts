export interface Technique {
  id: string;
  name: string;
  tacticId: string;
  description: string;
  isSubTechnique?: boolean;
  parentId?: string;
}

export interface Tactic {
  id: string;
  name: string;
  shortName: string;
  order: number;
}

export interface DetectionCoverage {
  techniqueId: string;
  level: 0 | 1 | 2 | 3; // 0 = none, 1 = low, 2 = medium, 3 = high
  sources: string[];
  detections: Array<{ name: string; source: string }>;
}

export interface IndustryStandard {
  id: string;
  name: string;
  description: string;
  techniques: string[];
}

export interface ATPGroup {
  id: string;
  name: string;
  description: string;
  techniques: string[];
  active: boolean;
  aliases?: string[];
  modified?: string;
}

export interface MatrixSnapshot {
  version: string;
  fetchedAt: string;
  tactics: Tactic[];
  techniques: Technique[];
  groups: ATPGroup[];
  isFallback: boolean;
}

export interface FilterState {
  showOrgDetections: boolean;
  selectedStandards: string[];
  selectedATPs: string[];
  highlightMode: 'coverage' | 'gaps' | 'both';
  searchQuery: string;
  selectedDataSources: string[];
  coverageLevels: ('none' | 'low' | 'medium' | 'high')[];
  showSubTechniques: boolean;
  onlyRecentGroups: boolean;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  colorScheme: 'indigo' | 'blue' | 'purple' | 'green' | 'cyan' | 'red' | 'custom';
  customColors: {
    low: string;
    medium: string;
    high: string;
  };
}
