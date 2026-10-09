import { useState, useRef, useEffect } from 'react';
import { FilterState, IndustryStandard, ATPGroup } from '../types';
import { DEFAULT_FILTER_STATE } from '../filterState';
import ThreatGroupPicker from './ThreatGroupPicker';

interface FilterPanelProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  standards: IndustryStandard[];
  atpGroups: ATPGroup[];
}

interface DropdownProps {
  label: string;
  selected: string[];
  options: { id: string; name: string; color?: string }[];
  onChange: (selected: string[]) => void;
  color?: 'green' | 'red' | 'blue' | 'indigo' | 'slate';
}

function Dropdown({ label, selected, options, onChange, color = 'blue' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const colorClasses = {
    green: 'bg-green-500 border-green-500',
    red: 'bg-red-500 border-red-500',
    blue: 'bg-blue-500 border-blue-500',
    indigo: 'bg-indigo-500 border-indigo-500',
    slate: 'bg-slate-500 border-slate-500'
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 transition-all flex items-center gap-2 min-w-[140px] justify-between"
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
          {options.map(option => (
            <label
              key={option.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggleOption(option.id)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500"
              />
              <span className="text-xs text-slate-900 flex-1">{option.name}</span>
              {selected.includes(option.id) && (
                <div className={`w-2 h-2 rounded-full ${colorClasses[color]}`}></div>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface SingleSelectDropdownProps {
  label: string;
  selected: string;
  options: { id: string; name: string }[];
  onChange: (selected: string) => void;
}

function SingleSelectDropdown({ label, selected, options, onChange }: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === selected);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 transition-all flex items-center gap-2 min-w-[140px] justify-between"
      >
        <span className="truncate">{selectedOption?.name || label}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                selected === option.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-900'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ filterState, onFilterChange, standards, atpGroups }: FilterPanelProps) {
  const dataSources = ['EDR', 'SIEM', 'Firewall', 'Email Gateway', 'Proxy', 'Network Monitor', 'AD Audit'];
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6 pb-4 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Your Organization</div>
              <button
                onClick={() => onFilterChange({ ...filterState, showOrgDetections: !filterState.showOrgDetections })}
                className={`inline-flex items-center gap-2 h-8 px-4 text-sm font-medium rounded-lg border transition-all ${
                  filterState.showOrgDetections
                    ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Detection Coverage
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">Show your detection capabilities</p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Compliance Requirements</div>
              <Dropdown
                label="Select Standards"
                selected={filterState.selectedStandards}
                options={standards.map(s => ({ id: s.id, name: s.name }))}
                onChange={(selected) => onFilterChange({ ...filterState, selectedStandards: selected })}
                color="green"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">Curated mapping — highlight required techniques</p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Threat Intelligence</div>
              <ThreatGroupPicker
                groups={atpGroups}
                selected={filterState.selectedATPs}
                onlyRecent={filterState.onlyRecentGroups}
                onSelectionChange={(selected) => onFilterChange({ ...filterState, selectedATPs: selected })}
                onOnlyRecentChange={(onlyRecentGroups) => onFilterChange({ ...filterState, onlyRecentGroups })}
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                {atpGroups.length} MITRE groups — coverage narrows to the techniques they use
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-semibold text-slate-700">Filters:</div>

            <SingleSelectDropdown
              label="Display Mode"
              selected={filterState.highlightMode}
              options={[
                { id: 'both', name: 'Show All' },
                { id: 'coverage', name: 'Coverage Only' },
                { id: 'gaps', name: 'Gaps Only' }
              ]}
              onChange={(mode) => onFilterChange({ ...filterState, highlightMode: mode as any })}
            />

            <button
              onClick={() => onFilterChange({ ...filterState, showSubTechniques: !filterState.showSubTechniques })}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-all ${
                filterState.showSubTechniques
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Sub-techniques
            </button>

            <Dropdown
              label="Coverage Level"
              selected={filterState.coverageLevels}
              options={[
                { id: 'high', name: 'High' },
                { id: 'medium', name: 'Medium' },
                { id: 'low', name: 'Low' },
                { id: 'none', name: 'None' }
              ]}
              onChange={(selected) => onFilterChange({ ...filterState, coverageLevels: selected as any })}
              color="indigo"
            />

            <Dropdown
              label="Data Sources"
              selected={filterState.selectedDataSources}
              options={dataSources.map(s => ({ id: s, name: s }))}
              onChange={(selected) => onFilterChange({ ...filterState, selectedDataSources: selected })}
              color="blue"
            />

            <div className="relative flex-1 min-w-[300px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filterState.searchQuery}
                onChange={(e) => onFilterChange({ ...filterState, searchQuery: e.target.value })}
                placeholder="Search techniques by ID, name, or description..."
                className="w-full h-8 pl-10 pr-4 text-xs rounded-lg border border-slate-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16 placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={() => setShowThresholdSettings(!showThresholdSettings)}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Thresholds
            </button>
          </div>

          {showThresholdSettings && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Coverage Level Thresholds</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onFilterChange(DEFAULT_FILTER_STATE)}
                    className="h-7 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 transition-all"
                  >
                    Reset to defaults
                  </button>
                  <button
                    onClick={() => setShowThresholdSettings(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Configure how many detections are required for each coverage level and choose a color scheme.
              </p>

              <div className="mb-4 pb-4 border-b border-slate-300">
                <label className="block text-xs font-medium text-slate-700 mb-2">Color Scheme</label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { id: 'indigo', name: 'Indigo', colors: ['bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'] },
                    { id: 'purple', name: 'Purple', colors: ['bg-purple-200', 'bg-purple-400', 'bg-purple-600'] },
                    { id: 'green', name: 'Green', colors: ['bg-green-200', 'bg-green-400', 'bg-green-600'] },
                    { id: 'cyan', name: 'Cyan', colors: ['bg-cyan-200', 'bg-cyan-400', 'bg-cyan-600'] },
                    { id: 'red', name: 'Red', colors: ['bg-red-200', 'bg-red-400', 'bg-red-600'] }
                  ].map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => onFilterChange({ ...filterState, colorScheme: scheme.id as any })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                        filterState.colorScheme === scheme.id
                          ? 'border-slate-900 bg-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {scheme.colors.map((color, idx) => (
                          <div key={idx} className={`w-3 h-3 rounded ${color}`}></div>
                        ))}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        filterState.colorScheme === scheme.id ? 'text-slate-900' : 'text-slate-600'
                      }`}>{scheme.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => onFilterChange({ ...filterState, colorScheme: 'custom' })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                      filterState.colorScheme === 'custom'
                        ? 'border-slate-900 bg-white shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex gap-0.5">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: filterState.customColors.low }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: filterState.customColors.medium }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: filterState.customColors.high }}></div>
                    </div>
                    <span className={`text-[10px] font-medium ${
                      filterState.colorScheme === 'custom' ? 'text-slate-900' : 'text-slate-600'
                    }`}>Custom</span>
                  </button>
                </div>

                {filterState.colorScheme === 'custom' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs font-medium text-slate-700 mb-2">Custom Colors (Hex)</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">Low Coverage</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={filterState.customColors.low}
                            onChange={(e) => onFilterChange({
                              ...filterState,
                              customColors: { ...filterState.customColors, low: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={filterState.customColors.low}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                onFilterChange({
                                  ...filterState,
                                  customColors: { ...filterState.customColors, low: value }
                                });
                              }
                            }}
                            placeholder="#C7D2FE"
                            className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">Medium Coverage</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={filterState.customColors.medium}
                            onChange={(e) => onFilterChange({
                              ...filterState,
                              customColors: { ...filterState.customColors, medium: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={filterState.customColors.medium}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                onFilterChange({
                                  ...filterState,
                                  customColors: { ...filterState.customColors, medium: value }
                                });
                              }
                            }}
                            placeholder="#818CF8"
                            className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">High Coverage</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={filterState.customColors.high}
                            onChange={(e) => onFilterChange({
                              ...filterState,
                              customColors: { ...filterState.customColors, high: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={filterState.customColors.high}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                onFilterChange({
                                  ...filterState,
                                  customColors: { ...filterState.customColors, high: value }
                                });
                              }
                            }}
                            placeholder="#4F46E5"
                            className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <span
                      className={filterState.colorScheme === 'custom' ? 'inline-block w-2 h-2 rounded-full mr-1' : `inline-block w-2 h-2 rounded-full bg-${filterState.colorScheme}-200 mr-1`}
                      style={filterState.colorScheme === 'custom' ? { backgroundColor: filterState.customColors.low } : undefined}
                    ></span>
                    Low Coverage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filterState.thresholds.low}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      onFilterChange({
                        ...filterState,
                        thresholds: { ...filterState.thresholds, low: value }
                      });
                    }}
                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">≥ {filterState.thresholds.low} detection(s)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <span
                      className={filterState.colorScheme === 'custom' ? 'inline-block w-2 h-2 rounded-full mr-1' : `inline-block w-2 h-2 rounded-full bg-${filterState.colorScheme}-400 mr-1`}
                      style={filterState.colorScheme === 'custom' ? { backgroundColor: filterState.customColors.medium } : undefined}
                    ></span>
                    Medium Coverage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filterState.thresholds.medium}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 2;
                      onFilterChange({
                        ...filterState,
                        thresholds: { ...filterState.thresholds, medium: value }
                      });
                    }}
                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">≥ {filterState.thresholds.medium} detection(s)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <span
                      className={filterState.colorScheme === 'custom' ? 'inline-block w-2 h-2 rounded-full mr-1' : `inline-block w-2 h-2 rounded-full bg-${filterState.colorScheme}-600 mr-1`}
                      style={filterState.colorScheme === 'custom' ? { backgroundColor: filterState.customColors.high } : undefined}
                    ></span>
                    High Coverage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filterState.thresholds.high}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 3;
                      onFilterChange({
                        ...filterState,
                        thresholds: { ...filterState.thresholds, high: value }
                      });
                    }}
                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">≥ {filterState.thresholds.high} detection(s)</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div>Coverage levels are based on <strong>total detections</strong> for each technique</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Example: 5 detections = High level (if threshold is 3)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
