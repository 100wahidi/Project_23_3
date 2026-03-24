import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarRange, LineChart, Table2, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch } from '../lib/api';

type KriMetadata = {
  columns: string[];
  groupable_columns: string[];
  time_columns: string[];
  kri_values: string[];
  default_group_by: string | null;
  default_time_column: string | null;
  default_kri: string | null;
};

type DistributionItem = {
  group_value: string;
  count: number;
  unique_kri: number;
  percentage: number;
};

type DistributionResponse = {
  group_by: string;
  total_rows: number;
  items: DistributionItem[];
};

type TrendRow = {
  kri: string;
  [key: string]: string | number | null;
};

type TrendSeriesPoint = {
  time: string;
  value: number | null;
};

type TrendResponse = {
  time_column: string;
  value_column: string;
  selected_kri: string | null;
  timeline: string[];
  pivot_columns: string[];
  pivot_table: TrendRow[];
  series: TrendSeriesPoint[];
  available_kri: string[];
  available_time_columns: string[];
  total_kri: number;
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return numberFormatter.format(value);
  const text = value.trim();
  return text ? text : '—';
}

function buildSvgLinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c1328] shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
            <Icon className="h-3.5 w-3.5 text-cyan-300" />
            KRI analytics
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function MiniMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function DistributionBars({ items }: { items: DistributionItem[] }) {
  const topItems = items.slice(0, 12);
  const max = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div className="space-y-4">
      {topItems.map((item) => (
        <div key={item.group_value} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div>
              <p className="font-medium text-white">{formatValue(item.group_value)}</p>
              <p className="text-xs text-slate-500">{item.unique_kri} unique KRI{item.unique_kri === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">{item.count}</p>
              <p className="text-xs text-slate-500">{item.percentage}%</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
              style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PivotTable({ rows, columns }: { rows: TrendRow[]; columns: string[] }) {
  return (
    <div className="overflow-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-[#101933]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className={`border-b border-white/10 px-4 py-3 text-left font-medium text-slate-300 ${
                  column === 'kri' ? 'sticky left-0 z-20 bg-[#101933]' : ''
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.kri}-${rowIndex}`} className="odd:bg-white/[0.02]">
              {columns.map((column) => (
                <td
                  key={`${row.kri}-${column}`}
                  className={`border-b border-white/5 px-4 py-3 text-slate-200 ${
                    column === 'kri' ? 'sticky left-0 z-10 bg-inherit font-medium text-white' : ''
                  }`}
                >
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendLineChart({ series }: { series: TrendSeriesPoint[] }) {
  const width = 960;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 40, left: 56 };

  const points = useMemo(() => {
    const numericSeries = series.filter((point) => typeof point.value === 'number' && Number.isFinite(point.value as number));
    if (!numericSeries.length) return [];

    const values = numericSeries.map((point) => point.value as number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueSpan = maxValue - minValue || 1;
    const stepX = numericSeries.length > 1 ? (width - padding.left - padding.right) / (numericSeries.length - 1) : 0;

    return numericSeries.map((point, index) => {
      const value = point.value as number;
      const x = padding.left + index * stepX;
      const normalized = (value - minValue) / valueSpan;
      const y = height - padding.bottom - normalized * (height - padding.top - padding.bottom);
      return { ...point, x, y, value };
    });
  }, [series]);

  if (!points.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">No time series data available for the selected KRI.</div>;
  }

  const path = buildSvgLinePath(points);
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const ticks = 4;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081226]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        <defs>
          <linearGradient id="kriLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {Array.from({ length: ticks + 1 }).map((_, index) => {
          const y = padding.top + ((height - padding.top - padding.bottom) / ticks) * index;
          const ratio = 1 - index / ticks;
          const tickValue = minValue + (maxValue - minValue) * ratio;
          return (
            <g key={index}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                {numberFormatter.format(tickValue)}
              </text>
            </g>
          );
        })}

        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="rgba(255,255,255,0.15)" />
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="rgba(255,255,255,0.15)" />

        <path d={path} fill="none" stroke="url(#kriLineGradient)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((point) => (
          <g key={`${point.time}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#0f172a" stroke="#67e8f9" strokeWidth="2" />
            <text
              x={point.x}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
              transform={`rotate(-20 ${point.x} ${height - padding.bottom + 18})`}
            >
              {point.time}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function KRIAnalytics() {
  const [metadata, setMetadata] = useState<KriMetadata | null>(null);
  const [distribution, setDistribution] = useState<DistributionResponse | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [groupBy, setGroupBy] = useState('bl');
  const [timeColumn, setTimeColumn] = useState('snapshot_date');
  const [kriDraft, setKriDraft] = useState('');
  const [selectedKri, setSelectedKri] = useState('');
  const [viewMode, setViewMode] = useState<'pivot' | 'curve'>('pivot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMetadata() {
      try {
        const response = await apiFetch<KriMetadata>('/kri/metadata', { method: 'GET' });
        if (!active) return;

        setMetadata(response);
        setGroupBy(response.default_group_by ?? 'bl');
        setTimeColumn(response.default_time_column ?? 'snapshot_date');
        setKriDraft(response.default_kri ?? '');
        setSelectedKri(response.default_kri ?? '');
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load KRI metadata.');
      }
    }

    void loadMetadata();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!metadata) return;

    let active = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError('');

        const [distributionResponse, trendResponse] = await Promise.all([
          apiFetch<DistributionResponse>(`/kri/distribution?group_by=${encodeURIComponent(groupBy)}`, { method: 'GET' }),
          apiFetch<TrendResponse>(
            `/kri/trend?time_column=${encodeURIComponent(timeColumn)}&selected_kri=${encodeURIComponent(selectedKri)}`,
            { method: 'GET' },
          ),
        ]);

        if (!active) return;

        setDistribution(distributionResponse);
        setTrend(trendResponse);

        if (trendResponse.selected_kri && trendResponse.selected_kri !== selectedKri) {
            setSelectedKri(trendResponse.selected_kri);
            setKriDraft(trendResponse.selected_kri);
        }
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load KRI analytics.');
        setDistribution(null);
        setTrend(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [groupBy, timeColumn, selectedKri, metadata]);

  const topDistributionLabel = distribution?.items[0]?.group_value ?? '—';
  const totalRows = distribution?.total_rows ?? 0;
  const totalKri = trend?.total_kri ?? metadata?.kri_values.length ?? 0;
  const timelineCount = trend?.timeline.length ?? 0;
  const selectedSeries = trend?.series ?? [];
  const pivotRows = trend?.pivot_table ?? [];
  const pivotColumns = trend?.pivot_columns ?? ['kri'];

  const applySelectedKri = () => {
    const nextValue = kriDraft.trim();
    if (!nextValue) {
      setKriDraft(selectedKri);
      return;
    }

    setSelectedKri(nextValue);
    setKriDraft(nextValue);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
              KRI analytics
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Distribution and trend explorer</h1>
              <p className="text-sm text-slate-400">
                Explore the KRI distribution by any column, then inspect the time pivot and exposure curve for a selected KRI.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Backend pivot and curve endpoints are active.
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            Backend fetch failed: {error}.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Loading KRI analytics from backend...</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Rows analyzed" value={formatValue(totalRows)} hint="Rows grouped in the selected distribution view" />
          <MiniMetric label="Unique KRI" value={formatValue(totalKri)} hint="Distinct KRI values available in the trend view" />
          <MiniMetric label="Timeline points" value={formatValue(timelineCount)} hint="Unique dates in the selected time column" />
          <MiniMetric label="Top group" value={formatValue(topDistributionLabel)} hint={`Current distribution grouped by ${groupBy}`} />
        </div>

        <SectionCard
          icon={BarChart3}
          title="KRI distribution"
          description="Choose a column to see how the KRI records are distributed across its values."
        >
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-4">
              <label className="block space-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <Table2 className="h-3.5 w-3.5" />
                  Group by column
                </span>
                <select
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#101933] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                >
                  {(metadata?.groupable_columns ?? ['bl', 'subbl', 'traitement', 'pending_date', 'snapshot_date']).map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected distribution</p>
                <p className="mt-2 text-lg font-semibold text-white">{groupBy}</p>
                <p className="mt-1 text-sm text-slate-400">The backend groups the cached dataframe by this column and returns the KRI distribution.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#081226] p-5">
              {distribution?.items?.length ? (
                <DistributionBars items={distribution.items} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                  No distribution data available.
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={LineChart}
          title="KRI trend over time"
          description="Inspect the pivot table for every KRI, then switch to the exposure curve for a selected KRI."
        >
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
              <label className="block space-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Time column
                </span>
                <select
                  value={timeColumn}
                  onChange={(event) => setTimeColumn(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#101933] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                >
                  {(metadata?.time_columns ?? ['snapshot_date', 'pending_date']).map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>

              <div className="block space-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  KRI selector
                </span>
                <div className="flex gap-2">
                  <input
                    list="kri-values"
                    value={kriDraft}
                    onChange={(event) => setKriDraft(event.target.value)}
                    placeholder="Type or pick a KRI value"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#101933] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                  />
                  <button
                    type="button"
                    onClick={applySelectedKri}
                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Apply
                  </button>
                </div>
                <datalist id="kri-values">
                  {(metadata?.kri_values ?? trend?.available_kri ?? []).map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col justify-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">View mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('pivot')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      viewMode === 'pivot' ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Pivot table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('curve')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      viewMode === 'curve' ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Courbe
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
              <div className="rounded-2xl border border-white/10 bg-[#081226] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {viewMode === 'pivot' ? 'Pivot table by KRI and time' : 'Exposure curve for selected KRI'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Value column: {trend?.value_column ?? 'exposure_days'} · time column: {timeColumn}
                    </p>
                  </div>
                  <LineChart className="h-5 w-5 text-slate-400" />
                </div>

                {viewMode === 'pivot' ? (
                  <PivotTable rows={pivotRows} columns={pivotColumns} />
                ) : (
                  <TrendLineChart series={selectedSeries} />
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected KRI</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatValue(trend?.selected_kri ?? selectedKri)}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    The backend aggregates exposure days by date for this KRI and returns the curve points.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#081226] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Curve points</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{selectedSeries.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Time buckets available for the selected KRI.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#081226] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pivot rows</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{pivotRows.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Each row corresponds to one KRI in the pivot table.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
