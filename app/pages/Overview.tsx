import { useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight, CheckCircle2, Database, Layers3, Sparkles } from 'lucide-react';
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
  imported_at?: string | null;
};

type OverviewApiResponse = {
  overview: OverviewMetrics;
  details: {
    duplicate_rows_sample: Array<Record<string, unknown>>;
    null_rows_sample: Array<Record<string, unknown>>;
    columns: string[];
  };
};

function isOverviewApiResponse(value: unknown): value is OverviewApiResponse {
  return Boolean(value && typeof value === 'object' && 'overview' in value && 'details' in value);
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: 'cyan' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    cyan: 'from-cyan-400/20 to-cyan-500/5 border-cyan-400/20',
    violet: 'from-violet-400/20 to-violet-500/5 border-violet-400/20',
    emerald: 'from-emerald-400/20 to-emerald-500/5 border-emerald-400/20',
    amber: 'from-amber-400/20 to-amber-500/5 border-amber-400/20',
  } as const;

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${tones[tone]} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-slate-200">{icon}</div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
        {hint}
      </div>
    </div>
  );
}

function DateCard({ value }: { value: string }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/8 to-white/3 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Database import date</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-slate-200">
          <Database className="h-5 w-5 text-cyan-200" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Timestamp returned by the backend when the CSV is loaded in memory.</p>
    </div>
  );
}

function formatImportDate(value?: string | null) {
  if (!value) return 'Unavailable';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export default function Overview() {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [duplicateRowsSample, setDuplicateRowsSample] = useState<Array<Record<string, unknown>>>([]);
  const [nullRowsSample, setNullRowsSample] = useState<Array<Record<string, unknown>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedRowsView, setSelectedRowsView] = useState<'duplicates' | 'nulls'>('duplicates');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        setLoading(true);
        setError('');

        const response = await apiFetch<unknown>('/Overview', { method: 'POST' });

        if (!active) return;

        if (!isOverviewApiResponse(response)) {
          throw new Error('Unexpected overview response shape');
        }

        setOverview(response.overview);
        setDuplicateRowsSample(response.details.duplicate_rows_sample ?? []);
        setNullRowsSample(response.details.null_rows_sample ?? []);
        setColumns(response.details.columns ?? []);
      } catch (fetchError) {
        if (!active) return;

        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load overview data.');
        setOverview(null);
        setDuplicateRowsSample([]);
        setNullRowsSample([]);
        setColumns([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      active = false;
    };
  }, []);

  const totalRows = overview?.total_rows ?? 0;
  const totalColumns = overview?.total_columns ?? 0;
  const completenessPercent = overview?.completeness_percent ?? 0;
  const uniquenessPercent = overview?.uniqueness_percent ?? 0;
  const importedAt = formatImportDate(overview?.imported_at);
  const activeRowsSample = selectedRowsView === 'duplicates' ? duplicateRowsSample : nullRowsSample;
  const rowsSampleLabel = selectedRowsView === 'duplicates' ? 'Duplicate rows sample' : 'Null rows sample';

  const rowsSampleColumns = (() => {
    const preferredOrder = ['kri', 'ggi', 'common_name', 'bl', 'subbl', 'pending_date', 'snapshot_date', 'traitement', 'exposure_days'];
    const availableColumns = columns.length > 0 ? columns : Object.keys(activeRowsSample[0] ?? {});
    const ordered = preferredOrder.filter((column) => availableColumns.includes(column));
    return ordered.length > 0 ? ordered : availableColumns.slice(0, 5);
  })();

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
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">Global data quality summary</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 lg:text-base">
                  This page shows only the essential cards for the dataset: completeness, uniqueness, and the database import date.
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
            <SectionTitle title="Summary cards" description="Only the essential global cards are displayed here." />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Completeness"
              value={`${completenessPercent}%`}
              hint="Share of populated cells"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-200" />}
              tone="emerald"
            />
            <SummaryCard
              label="Uniqueness"
              value={`${uniquenessPercent}%`}
              hint="Share of non-duplicated rows"
              icon={<Sparkles className="h-5 w-5 text-violet-200" />}
              tone="violet"
            />
            <SummaryCard
              label="Total rows"
              value={String(totalRows)}
              hint="Rows loaded in backend"
              icon={<Database className="h-5 w-5 text-cyan-200" />}
              tone="cyan"
            />
            <SummaryCard
              label="Total columns"
              value={String(totalColumns)}
              hint="Columns detected in backend"
              icon={<Layers3 className="h-5 w-5 text-amber-200" />}
              tone="amber"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DateCard value={importedAt} />
            <div className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-sm">
              <p className="text-sm text-slate-400">Database status</p>
              <p className="mt-2 text-3xl font-semibold text-white">Active</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Data is read from the backend cache, so the overview remains lightweight and fast.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/5 bg-white/5 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-400">Row samples</p>
                <h3 className="mt-1 text-lg font-semibold text-white">View duplicate rows or null rows</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRowsView('duplicates')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedRowsView === 'duplicates' ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  Duplicate rows
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRowsView('nulls')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedRowsView === 'nulls' ? 'bg-primary text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  Null rows
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-2xl border border-white/5">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#0d1530] text-left text-slate-400">
                  <tr>
                    {rowsSampleColumns.map((column) => (
                      <th key={column} className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-[0.08em]">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeRowsSample.length ? (
                    activeRowsSample.map((row, index) => (
                      <tr key={`${selectedRowsView}-${index}`} className="border-t border-white/5 hover:bg-white/5">
                        {rowsSampleColumns.map((column) => (
                          <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-300">
                            {String(row[column] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-white/5">
                      <td className="px-4 py-3 text-slate-400" colSpan={Math.max(rowsSampleColumns.length, 1)}>
                        No {selectedRowsView === 'duplicates' ? 'duplicate' : 'null'} rows sample returned by the backend.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">{rowsSampleLabel} from the backend overview response.</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
