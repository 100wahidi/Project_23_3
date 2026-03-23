import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Layers3,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch } from '../lib/api';

type OverviewMetrics = {
  total_rows: number;
  total_columns: number;
  duplicate_rows: number;
  unique_rows: number;
  completeness_percent: number;
  uniqueness_percent: number;
  missing_values: Record<string, number>;
};

type OverviewDetails = {
  duplicate_rows_sample: Array<Record<string, unknown>>;
  columns: string[];
};

type OverviewApiResponse = {
  overview: OverviewMetrics;
  details: OverviewDetails;
};

function isOverviewApiResponse(value: unknown): value is OverviewApiResponse {
  return (
    value !== null &&
    typeof value === 'object' &&
    'overview' in value &&
    'details' in value &&
    typeof (value as OverviewApiResponse).overview === 'object' &&
    typeof (value as OverviewApiResponse).details === 'object'
  );
}

function getBand(percent: number) {
  if (percent >= 90) {
    return { label: 'Excellent', tone: 'text-emerald-200', fill: 'from-emerald-400 to-cyan-400' } as const;
  }

  if (percent >= 70) {
    return { label: 'Healthy', tone: 'text-cyan-200', fill: 'from-cyan-400 to-blue-400' } as const;
  }

  if (percent >= 40) {
    return { label: 'Watch', tone: 'text-amber-200', fill: 'from-amber-400 to-orange-400' } as const;
  }

  return { label: 'Low', tone: 'text-rose-200', fill: 'from-rose-400 to-red-400' } as const;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function KPIAccentCard({
  label,
  value,
  icon,
  trend,
  barPercent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trend: string;
  barPercent: number;
}) {
  const normalizedPercent = Math.min(100, Math.max(8, barPercent));
  const band = getBand(normalizedPercent);

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/8 to-white/3 p-5 shadow-sm">
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${band.fill}`} style={{ width: `${normalizedPercent}%` }} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-slate-200">{icon}</div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
          {trend}
        </div>
        <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${band.tone}`}>{band.label}</div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = 'cyan',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'cyan' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    cyan: 'from-cyan-400/20 to-cyan-500/5 ring-cyan-400/20',
    violet: 'from-violet-400/20 to-violet-500/5 ring-violet-400/20',
    emerald: 'from-emerald-400/20 to-emerald-500/5 ring-emerald-400/20',
    amber: 'from-amber-400/20 to-amber-500/5 ring-amber-400/20',
  } as const;

  return (
    <div className={`rounded-3xl border border-white/5 bg-gradient-to-br ${tones[tone]} p-5 shadow-sm`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function Overview() {
  const [apiOverview, setApiOverview] = useState<OverviewMetrics | null>(null);
  const [apiDuplicateRows, setApiDuplicateRows] = useState<Array<Record<string, unknown>>>([]);
  const [apiColumns, setApiColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        setLoading(true);
        setError('');

        const overviewResponse = await apiFetch<unknown>('/Overview', { method: 'POST' });

        if (!active) {
          return;
        }

        if (!isOverviewApiResponse(overviewResponse)) {
          throw new Error('Unexpected overview response shape');
        }

        setApiOverview(overviewResponse.overview);
        setApiDuplicateRows(overviewResponse.details.duplicate_rows_sample ?? []);
        setApiColumns(overviewResponse.details.columns ?? []);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load overview data.');
        setApiOverview(null);
        setApiDuplicateRows([]);
        setApiColumns([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      active = false;
    };
  }, []);

  const totalRows = apiOverview?.total_rows ?? 0;
  const totalColumns = apiOverview?.total_columns ?? 0;
  const duplicateCount = apiOverview?.duplicate_rows ?? 0;
  const uniqueCount = apiOverview?.unique_rows ?? 0;
  const completenessPercent = apiOverview?.completeness_percent ?? 0;
  const uniquenessPercent = apiOverview?.uniqueness_percent ?? 0;
  const duplicateRate = totalRows > 0 ? (duplicateCount / totalRows) * 100 : 0;

  const missingValuesEntries = useMemo(() => Object.entries(apiOverview?.missing_values ?? {}), [apiOverview]);
  const missingColumnsCount = missingValuesEntries.filter(([, value]) => Number(value) > 0).length;
  const missingCellCount = missingValuesEntries.reduce((sum, [, value]) => sum + Number(value ?? 0), 0);
  const missingRate = totalRows > 0 && totalColumns > 0 ? (missingCellCount / (totalRows * totalColumns)) * 100 : 0;

  const duplicateSampleColumns = useMemo(() => {
    const preferredOrder = ['kri', 'ggi', 'common_name', 'bl', 'subbl', 'pending_date', 'snapshot_date', 'traitement', 'exposure_days'];
    const availableColumns = apiColumns.length > 0 ? apiColumns : Object.keys(apiDuplicateRows[0] ?? {});
    const ordered = preferredOrder.filter((column) => availableColumns.includes(column));

    return ordered.length > 0 ? ordered : availableColumns.slice(0, 5);
  }, [apiColumns, apiDuplicateRows]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_24%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
                <Layers3 className="h-3.5 w-3.5 text-cyan-300" />
                Overview
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">Backend-driven overview dashboard.</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 lg:text-base">
                  This page now reads only from the FastAPI <span className="font-semibold text-white">POST /Overview</span> endpoint and surfaces the computed KPI values,
                  duplicate samples, and missing-value summaries.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            Backend fetch failed: {error}.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Loading overview from backend...</div>
        ) : null}

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <SectionTitle title="Section 1 — Data Quality Summary" description="Summary KPI cards driven by the backend overview response." />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <Layers3 className="h-3.5 w-3.5 text-cyan-300" />
              Summary only
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPIAccentCard
              label="Completeness"
              value={`${completenessPercent}%`}
              trend="Backend quality score"
              barPercent={completenessPercent}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-200" />}
            />
            <KPIAccentCard
              label="Uniqueness"
              value={`${uniquenessPercent}%`}
              trend="Backend uniqueness score"
              barPercent={uniquenessPercent}
              icon={<Sparkles className="h-5 w-5 text-violet-200" />}
            />
            <KPIAccentCard
              label="Total rows"
              value={String(totalRows)}
              trend="Backend-loaded row count"
              barPercent={100}
              icon={<Database className="h-5 w-5 text-cyan-200" />}
            />
            <KPIAccentCard
              label="Total columns"
              value={String(totalColumns)}
              trend="Schema width from backend"
              barPercent={totalRows > 0 ? (totalColumns / Math.max(totalRows, totalColumns, 1)) * 100 : 0}
              icon={<Layers3 className="h-5 w-5 text-amber-200" />}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <SectionTitle title="Section 2 — Health & Footprint" description="Backend KPIs and footprint cards for the dataset health." />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              Total rows · Total columns · Duplicate rate
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total rows" value={totalRows} hint="Loaded records from the backend." tone="cyan" />
            <MetricCard label="Total columns" value={totalColumns} hint="Schema width returned by /Overview." tone="violet" />
            <MetricCard label="Duplicate rows" value={duplicateCount} hint="Rows flagged as duplicated by the backend." tone="amber" />
            <MetricCard label="Unique rows" value={uniqueCount} hint="Non-duplicated rows computed by the backend." tone="emerald" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-cyan-50">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Rows / columns ratio</p>
              <p className="mt-2 text-2xl font-semibold">{totalColumns > 0 ? (totalRows / totalColumns).toFixed(2) : '0.00'}</p>
              <p className="mt-2 text-xs text-cyan-100/75">Derived from the backend overview payload.</p>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-4 text-violet-50">
              <p className="text-xs uppercase tracking-[0.22em] text-violet-100/80">Missing cells</p>
              <p className="mt-2 text-2xl font-semibold">{missingCellCount}</p>
              <p className="mt-2 text-xs text-violet-100/75">Calculated from the backend missing-values map.</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-amber-50">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/80">Missing rate</p>
              <p className="mt-2 text-2xl font-semibold">{formatPercent(missingRate)}</p>
              <p className="mt-2 text-xs text-amber-100/75">Across all cells in the loaded dataset.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <SectionTitle title="Section 3 — Issues" description="Duplicate rows preview and missing-values table from the backend overview response." />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-300" />
              {missingColumnsCount} columns with missing values
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-white/5 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Duplicate rows preview</h3>
                  <p className="text-sm text-slate-400">Sample rows flagged as duplicates by the backend.</p>
                </div>
                <div className="text-sm text-slate-400">{apiDuplicateRows.length} rows</div>
              </div>

              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#0d1530] text-left text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Row</th>
                      {duplicateSampleColumns.map((column) => (
                        <th key={column} className="px-5 py-3 font-medium uppercase tracking-[0.08em]">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiDuplicateRows.length ? (
                      apiDuplicateRows.map((item, index) => {
                        const row = item as Record<string, unknown>;

                        return (
                          <tr key={`duplicate-${index}`} className="border-t border-white/5 hover:bg-white/5">
                            <td className="px-5 py-4 text-white">#{index + 1}</td>
                            {duplicateSampleColumns.map((column) => (
                              <td key={column} className="px-5 py-4 text-slate-300">
                                {String(row[column] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-white/5">
                        <td className="px-5 py-4 text-slate-400" colSpan={duplicateSampleColumns.length + 1}>
                          No duplicate row sample returned by the backend.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/5 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Missing values table</h3>
                  <p className="text-sm text-slate-400">Column-level missing value counts returned by the backend.</p>
                </div>
                <div className="text-sm text-slate-400">{missingValuesEntries.length} columns</div>
              </div>

              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#0d1530] text-left text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Column</th>
                      <th className="px-5 py-3 font-medium">Missing count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingValuesEntries.length ? (
                      missingValuesEntries.map(([column, value]) => (
                        <tr key={column} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-5 py-4 text-white">{column}</td>
                          <td className="px-5 py-4 text-slate-300">{String(value)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-white/5">
                        <td className="px-5 py-4 text-slate-400" colSpan={2}>
                          No missing values were returned by the backend.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-amber-400/15 bg-amber-400/8 p-5 text-sm text-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
              <div>
                <p className="font-semibold">Backend-only data flow</p>
                <p className="mt-1 text-amber-50/80">
                  This page no longer reads mock table data. The visuals, counts, duplicate sample, and missing-value summary are derived from the FastAPI POST /Overview
                  response.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
