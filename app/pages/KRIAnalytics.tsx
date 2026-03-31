import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarRange, RefreshCcw, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch } from '../lib/api';

type PivotRow = Record<string, string | number | null>;

type PivotResponse = {
  table: PivotRow[];
  dates: string[];
  kri_values?: string[];
};

type KriStatsResponse = {
  breaches_number?: number;
  most_freq_breach?: string;
  last_snapshot_date?: string;
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  const text = String(value).trim();
  return text ? text : '—';
}

function MiniMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function KRIDistribution() {
  const [timeColumn, setTimeColumn] = useState('snapshot_date');
  const [kriFilterDraft, setKriFilterDraft] = useState('');
  const [kriFilter, setKriFilter] = useState<string[]>([]);
  const [pivotData, setPivotData] = useState<PivotRow[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [stats, setStats] = useState<KriStatsResponse | null>(null);
  const [loadingPivot, setLoadingPivot] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorPivot, setErrorPivot] = useState('');
  const [errorStats, setErrorStats] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('time_column', timeColumn);

    if (kriFilter.length) {
      kriFilter.forEach((kri) => params.append('kri', kri));
    }

    return params.toString() ? `?${params.toString()}` : '';
  }, [timeColumn, kriFilter]);

  async function loadPivot() {
    try {
      setLoadingPivot(true);
      setErrorPivot('');

      const response = await apiFetch<PivotResponse>(`/data-analysis${queryString}`, { method: 'GET' });

      setPivotData(response.table ?? []);
      setDates(response.dates ?? []);
    } catch (e) {
      setErrorPivot(e instanceof Error ? e.message : 'Failed to load KRI distribution.');
      setPivotData([]);
      setDates([]);
    } finally {
      setLoadingPivot(false);
    }
  }

  async function loadStats() {
    try {
      setLoadingStats(true);
      setErrorStats('');

      const response = await apiFetch<KriStatsResponse>(`/kri/stats${queryString}`, { method: 'GET' });
      setStats(response);
    } catch (e) {
      setErrorStats(e instanceof Error ? e.message : 'Failed to load KRI stats.');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  async function reloadAll() {
    await Promise.all([loadStats(), loadPivot()]);
  }

  useEffect(() => {
    void reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const columns = useMemo(() => {
    const allKeys = new Set<string>();
    pivotData.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
    return Array.from(allKeys);
  }, [pivotData]);

  const applyFilter = () => {
    const parsed = kriFilterDraft
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    setKriFilter(parsed);
  };

  const clearFilter = () => {
    setKriFilterDraft('');
    setKriFilter([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                KRI distribution over time
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Snapshot date en X, KRI en Y
              </h1>
              <p className="text-sm text-slate-400">
                Visualise la distribution des KRI dans le temps avec filtres et indicateurs clés.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              Backend endpoints: <span className="font-semibold">/data-analysis</span> and <span className="font-semibold">/kri/stats</span>
            </div>
          </div>
        </section>

        {(errorStats || errorPivot) && (
          <div className="space-y-2">
            {errorStats ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                Stats endpoint failed: {errorStats}
              </div>
            ) : null}
            {errorPivot ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                Pivot endpoint failed: {errorPivot}
              </div>
            ) : null}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#0c1328] shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
                Summary
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">KRI metrics</h2>
              <p className="mt-1 text-sm text-slate-400">
                Valeurs calculées côté backend via une route séparée.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              {loadingStats ? 'Loading stats…' : 'Stats loaded'}
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniMetric
                label="KRI le plus fréquent"
                value={loadingStats ? '…' : formatValue(stats?.most_freq_breach)}
                hint="Breach le plus représenté"
              />
              <MiniMetric
                label="Nombre de KRI"
                value={loadingStats ? '…' : formatValue(stats?.breaches_number)}
                hint="Nombre total de KRI distincts"
              />
              <MiniMetric
                label="Dernière date"
                value={loadingStats ? '…' : formatValue(stats?.last_snapshot_date)}
                hint="Max(snapshot_date)"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <CalendarRange className="h-3.5 w-3.5" />
                Time column
              </span>
              <select
                value={timeColumn}
                onChange={(e) => setTimeColumn(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101933] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
              >
                <option value="snapshot_date">snapshot_date</option>
                <option value="pending_date">pending_date</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">KRI filter</span>
              <input
                value={kriFilterDraft}
                onChange={(e) => setKriFilterDraft(e.target.value)}
                placeholder="KRI A, KRI B"
                className="w-full rounded-2xl border border-white/10 bg-[#101933] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applyFilter}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearFilter}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void reloadAll()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#081226] shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-white">Pivot table</p>
              <p className="text-xs text-slate-500">
                {dates.length} date(s) loaded · endpoint: <span className="text-slate-300">GET /data-analysis{queryString}</span>
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {loadingPivot ? 'Loading…' : `${pivotData.length} rows`}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-[#101933]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="border-b border-white/10 px-4 py-3 text-left font-medium text-slate-300"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotData.length ? (
                  pivotData.map((row, idx) => (
                    <tr key={idx} className="odd:bg-white/[0.02]">
                      {columns.map((col) => (
                        <td
                          key={`${idx}-${col}`}
                          className="border-b border-white/5 px-4 py-3 text-slate-200"
                        >
                          {formatValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-8 text-center text-sm text-slate-400">
                      {loadingPivot ? 'Loading…' : 'No pivot data returned by backend.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}