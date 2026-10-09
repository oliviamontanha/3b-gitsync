import { useState, useRef, useEffect } from 'react';
import { Technique } from '../types';
import { getLevelColor, getTextColorForBackground, darkenColor } from '../utils';

interface TechniqueCellProps {
  technique: Technique;
  level: number;
  sources: string[];
  reasons: string[];
  detections: Array<{ name: string; source: string }>;
  highlightMode: string;
  matchedStandards: string[];
  matchedATPs: string[];
  colorScheme?: string;
  customColors?: { low: string; medium: string; high: string };
  hasSubTechniques?: boolean;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  showSubTechniques?: boolean;
  subTechniques?: Array<{
    id: string;
    name: string;
    level: number;
    sources: string[];
  }>;
}

export default function TechniqueCell({
  technique,
  level,
  sources,
  reasons,
  detections,
  highlightMode,
  matchedStandards,
  matchedATPs,
  colorScheme = 'indigo',
  customColors,
  hasSubTechniques = false,
  onToggleExpand,
  isExpanded = false,
  showSubTechniques = true
}: TechniqueCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('left');
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const tooltipWidth = 288;
      const viewportWidth = window.innerWidth;

      if (rect.left + tooltipWidth > viewportWidth - 20) {
        setTooltipPosition('right');
      } else {
        setTooltipPosition('left');
      }
    }
  }, [showTooltip]);

  const colorClass = getLevelColor(level, highlightMode, colorScheme, customColors);

  const isCustomColor = colorClass.startsWith('CUSTOM:');
  const customHexColor = isCustomColor ? colorClass.replace('CUSTOM:', '') : null;

  const customStyle = customHexColor ? {
    backgroundColor: customHexColor,
    borderColor: darkenColor(customHexColor, 30),
    color: getTextColorForBackground(customHexColor)
  } : undefined;

  const hasOverlays = matchedStandards.length > 0 || matchedATPs.length > 0;
  const isSubTechnique = technique.isSubTechnique || technique.id.includes('.');
  const shouldShowExpander = hasSubTechniques && !isSubTechnique && showSubTechniques;

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`p-1.5 border rounded text-[10px] cursor-pointer transition-all hover:shadow-sm relative ${
          isCustomColor ? '' : colorClass
        } ${isSubTechnique ? 'ml-3 opacity-90' : ''}`}
        style={customStyle}
        onClick={shouldShowExpander ? onToggleExpand : undefined}
      >
        {shouldShowExpander && (
          <div className="absolute left-1 top-1">
            <svg
              className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {isSubTechnique && (
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-400"></div>
        )}

        {hasOverlays && (
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {matchedStandards.length > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 border border-white" title="Required by standard"></div>
            )}
            {matchedATPs.length > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 border border-white" title="Used by threat group"></div>
            )}
          </div>
        )}

        <div className={`font-semibold mb-0.5 ${shouldShowExpander ? 'pl-2' : ''}`}>{technique.id}</div>
        <div className={`text-[9px] leading-tight line-clamp-2 ${shouldShowExpander ? 'pl-2' : ''}`}>{technique.name}</div>
      </div>

      {showTooltip && (
        <div className={`absolute z-50 top-full mt-1 w-72 bg-slate-900 text-white text-xs rounded-lg shadow-[0px_20px_40px_rgba(0,0,0,0.2)] p-3 pointer-events-none ${
          tooltipPosition === 'left' ? 'left-0' : 'right-0'
        }`}>
          <div className="font-semibold mb-1">
            {technique.id}: {technique.name}
            {isSubTechnique && <span className="text-slate-400 ml-1">(Sub-technique)</span>}
          </div>
          <div className="text-slate-300 mb-2 text-[11px] leading-relaxed">{technique.description}</div>

          {sources.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-1 font-medium">Coverage Summary</div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-white font-semibold">{detections.length} detection{detections.length !== 1 ? 's' : ''}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">{sources.length} unique source{sources.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {sources.map((source, idx) => (
                  <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 text-[9px] font-medium">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detections.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-1.5 font-medium">Detections ({detections.length})</div>
              <div className="space-y-1.5">
                {detections.map((detection, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-medium flex-shrink-0 mt-0.5">
                      {detection.source}
                    </span>
                    <span className="text-slate-300 text-[11px] leading-snug">{detection.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedStandards.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-1 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Required by Standards
              </div>
              <div className="flex flex-wrap gap-1">
                {matchedStandards.map(standard => (
                  <span key={standard} className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium rounded bg-green-500/20 text-green-300 border border-green-500/30">
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchedATPs.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-1 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Used by Threat Groups
              </div>
              <div className="flex flex-wrap gap-1">
                {matchedATPs.map(atp => (
                  <span key={atp} className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    {atp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {reasons.length > 0 && (
            <div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-1 font-medium">Context</div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-blue-400">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
