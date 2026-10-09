import { MatrixSnapshot } from '../types';

interface HeaderProps {
  stats: {
    total: number;
    none: number;
    low: number;
    medium: number;
    high: number;
    percentage: number;
    covered: number;
    totalDetections: number;
    parentTechniques: number;
    subTechniques: number;
    scoped: boolean;
  };
  matrix: MatrixSnapshot;
  fallbackReason: string | null;
}

function formatDate(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  return new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Header({ stats, matrix, fallbackReason }: HeaderProps) {
  const refreshed = formatDate(matrix.fetchedAt);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 mb-0.5">
              MITRE ATT&CK Coverage Heatmap
            </h1>
            <p className="text-xs text-slate-600">
              Compare detection coverage against compliance and threat groups • Configurable thresholds
            </p>
            <div className="mt-1.5">
              {matrix.isFallback ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                  title={fallbackReason ?? undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Using bundled ATT&CK data — live matrix unavailable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ATT&CK v{matrix.version}
                  {refreshed && <span className="text-slate-400">• refreshed {refreshed}</span>}
                  <span className="text-slate-400">• {matrix.groups.length} threat groups</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 min-w-[110px] text-center">
              <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                {stats.scoped ? 'Coverage in Scope' : 'Total Coverage'}
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {stats.percentage}%
              </div>
              {stats.scoped && (
                <div className="text-[9px] text-slate-500 mt-0.5">threat-intel selection</div>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 min-w-[110px] text-center">
              <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                Techniques Covered
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {stats.covered} <span className="text-base text-slate-500">/ {stats.total}</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {stats.parentTechniques} parent + {stats.subTechniques} sub
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 min-w-[110px] text-center">
              <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                Total Detections
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {stats.totalDetections}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
