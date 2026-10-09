import { useEffect, useMemo, useRef, useState } from 'react';
import { ATPGroup } from '../types';

interface ThreatGroupPickerProps {
  groups: ATPGroup[];
  selected: string[];
  onlyRecent: boolean;
  onSelectionChange: (selected: string[]) => void;
  onOnlyRecentChange: (onlyRecent: boolean) => void;
}

export default function ThreatGroupPicker({
  groups,
  selected,
  onlyRecent,
  onSelectionChange,
  onOnlyRecentChange,
}: ThreatGroupPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .filter(group => !onlyRecent || group.active)
      .filter(group => {
        if (!needle) return true;
        if (group.name.toLowerCase().includes(needle)) return true;
        if (group.id.toLowerCase().includes(needle)) return true;
        return (group.aliases ?? []).some(alias => alias.toLowerCase().includes(needle));
      });
  }, [groups, onlyRecent, query]);

  const selectedGroups = groups.filter(group => selected.includes(group.id));

  const toggle = (id: string) => {
    onSelectionChange(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 transition-all flex items-center gap-2 min-w-[140px] justify-between"
      >
        <span className="truncate">
          {selected.length === 0 ? 'Select Groups' : `Select Groups (${selected.length})`}
        </span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {selectedGroups.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedGroups.map(group => (
            <button
              key={group.id}
              onClick={() => toggle(group.id)}
              title={`Remove ${group.name}`}
              className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 pl-2 pr-1.5 py-0.5 text-[10px] font-medium text-red-800 hover:bg-red-100"
            >
              {group.name}
              <span className="text-red-400">×</span>
            </button>
          ))}
          <button
            onClick={() => onSelectionChange([])}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-700 px-1"
          >
            Clear
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-slate-100 space-y-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search name or alias, e.g. Cozy Bear"
              className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-500/16"
            />
            <label className="flex items-center gap-2 text-[10px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyRecent}
                onChange={event => onOnlyRecentChange(event.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500"
              />
              Updated by MITRE in the last year
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {visible.length === 0 && (
              <div className="px-3 py-4 text-xs text-slate-500 text-center">No groups match that search.</div>
            )}
            {visible.map(group => (
              <label key={group.id} className="flex items-start gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(group.id)}
                  onChange={() => toggle(group.id)}
                  className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-blue-500"
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-900 truncate">{group.name}</span>
                    <span className="text-[10px] text-slate-400">{group.id}</span>
                  </span>
                  {(group.aliases ?? []).length > 0 && (
                    <span className="block text-[10px] text-slate-500 truncate">
                      {(group.aliases ?? []).slice(0, 4).join(', ')}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                  {group.techniques.length} tech
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
