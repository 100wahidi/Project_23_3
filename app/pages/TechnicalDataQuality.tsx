import { useEffect, useMemo, useState } from 'react';
import { Database, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { technicalDataRows, technicalValidationMock } from '../lib/mock-data';
import { apiFetch } from '../lib/api';

type LoadingRecord = Record<string, string | number | boolean | null>;

type ValidationFailure = {
  column: string | null;
  check: string | null;
  failure_case: string | number | boolean | null;
  index: number | null;
};

type ValidationResult = {
  status: 'success' | 'failed';
  total_rows: number;
  report: ValidationFailure[];
};

type LoadingResult = {
  total_rows: number;
  page: number;
  page_size: number;
  data: LoadingRecord[];
};

function isLoadingResult(value: unknown): value is LoadingResult {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as LoadingResult).data));
}

type GroupedCheck = {
  check: string;
  entries: ValidationFailure[];
};

type GroupedColumn = {
  column: string;
  entries: ValidationFailure[];
  checks: Record<string, GroupedCheck>;
};

function formatCellValue(value: LoadingRecord[string] | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const text = String(value).trim();
  return text ? text : '—';
}

function normalizeIndex(value: unknown) {
  const index = Number(value);
  return Number.isFinite(index) ? index : null;
}

function groupValidationReport(report: ValidationFailure[] = []) {
  return report.reduce<Record<string, GroupedColumn>>((acc, entry) => {
    const column = formatCellValue(entry.column);
    const check = formatCellValue(entry.check);

    if (!acc[column]) {
      acc[column] = {
        column,
        entries: [],
        checks: {},
      };
    }

    if (!acc[column].checks[check]) {
      acc[column].checks[check] = {
        check,
        entries: [],
      };
    }

    acc[column].entries.push(entry);
    acc[column].checks[check].entries.push(entry);

    return acc;
  }, {});
}

function getSeverityLabel(percent: number) {
  if (percent >= 35) return { label: 'Critical', tone: 'text-rose-200', fill: 'from-rose-400 to-red-500' } as const;
  if (percent >= 20) return { label: 'High', tone: 'text-orange-200', fill: 'from-orange-400 to-amber-500' } as const;
  if (percent >= 10) return { label: 'Medium', tone: 'text-amber-200', fill: 'from-amber-400 to-yellow-400' } as const;
  return { label: 'Low', tone: 'text-cyan-200', fill: 'from-cyan-400 to-blue-400' } as const;
}

function CheckCard({
  check,
  count,
  total,
}: {
  check: string;
  count: number;
  total: number;
}) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  const severity = getSeverityLabel(percent);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1530] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Check type</p>
          <p className="mt-2 text-lg font-semibold text-white">{check}</p>
        </div>
        <span className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severity.tone}`}>
          {severity.label}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${severity.fill}`} style={{ width: `${Math.min(100, Math.max(6, percent))}%` }} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold text-white">{count}</p>
          <p className="mt-1 text-xs text-slate-500">{percent.toFixed(1)}% of all issues</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gravity</p>
          <p className={`mt-1 text-sm font-semibold ${severity.tone}`}>{severity.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function TechnicalDataQuality() {
  const [rawData, setRawData] = useState<LoadingRecord[]>(technicalDataRows as LoadingRecord[]);
  const [validation, setValidation] = useState<ValidationResult>(technicalValidationMock as ValidationResult);
  const [loadedRows, setLoadedRows] = useState<number>(technicalDataRows.length);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const columns = useMemo(() => Object.keys(rawData[0] ?? {}), [rawData]);

  const groupedReport = useMemo(() => groupValidationReport(validation?.report ?? []), [validation]);
  const reportColumns = useMemo(() => Object.values(groupedReport), [groupedReport]);

  const reportByIndex = useMemo(() => {
    const map = new Map<number, ValidationFailure[]>();
    (validation?.report ?? []).forEach((entry) => {
      const index = normalizeIndex(entry.index);
      if (index === null) return;
      if (!map.has(index)) map.set(index, []);
      map.get(index)!.push(entry);
    });
    return map;
  }, [validation]);

  const checkSummary = useMemo(() => {
    const totalIssues = validation?.report.length ?? 0;
    const counts = new Map<string, number>();

    (validation?.report ?? []).forEach((entry) => {
      const check = formatCellValue(entry.check);
      counts.set(check, (counts.get(check) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([check, count]) => ({ check, count, percent: totalIssues > 0 ? (count / totalIssues) * 100 : 0 }))
      .sort((left, right) => right.count - left.count);
  }, [validation]);

  const [selectedColumn, setSelectedColumn] = useState<string>(reportColumns[0]?.column ?? '');
  const [selectedCheck, setSelectedCheck] = useState<string>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [openColumns, setOpenColumns] = useState<Record<string, boolean>>(() =>
    reportColumns[0]?.column ? { [reportColumns[0].column]: true } : {},
  );
  const [openChecks, setOpenChecks] = useState<Record<string, boolean>>({});

  const selectedColumnData = selectedColumn ? groupedReport[selectedColumn] : null;

  const selectedCheckEntries = useMemo(() => {
    if (!selectedColumnData) return [];
    if (selectedCheck === 'ALL') return selectedColumnData.entries;
    return selectedColumnData.checks[selectedCheck]?.entries ?? [];
  }, [selectedCheck, selectedColumnData]);

  const filteredEntries = useMemo(() => {
    if (selectedIndex === null) return selectedCheckEntries;
    return selectedCheckEntries.filter((entry) => normalizeIndex(entry.index) === selectedIndex);
  }, [selectedCheckEntries, selectedIndex]);

  const selectedEntry = filteredEntries[0] ?? selectedCheckEntries[0] ?? null;
  const selectedRowIndex = normalizeIndex(selectedEntry?.index);
  const selectedRow = selectedRowIndex === null ? null : rawData[selectedRowIndex] ?? null;
  const selectedRowIssues = selectedRowIndex === null ? [] : reportByIndex.get(selectedRowIndex) ?? [];

  const issueCount = validation?.report.length ?? 0;
  const affectedRowsCount = reportByIndex.size;
  const impactedColumnsCount = reportColumns.length;

  useEffect(() => {
    let active = true;

    async function loadTechnicalData() {
      try {
        setLoading(true);
        setError('');

        const [loadingResponse, validationResponse] = await Promise.all([
          apiFetch<LoadingResult>('/loading?page=1&page_size=200', { method: 'GET' }),
          apiFetch<ValidationResult>('/validation', { method: 'POST' }),
        ]);

        if (!active) return;

        if (isLoadingResult(loadingResponse)) {
          setRawData(loadingResponse.data);
          setLoadedRows(loadingResponse.total_rows);
        } else {
          throw new Error('Unexpected /loading response shape');
        }

        setValidation(validationResponse);
      } catch (fetchError) {
        if (!active) return;

        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load technical data.');
        setRawData(technicalDataRows as LoadingRecord[]);
        setValidation(technicalValidationMock as ValidationResult);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTechnicalData();

    return () => {
      active = false;
    };
  }, []);

  const toggleColumn = (column: string) => {
    setOpenColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    setSelectedColumn(column);
    setSelectedCheck('ALL');
    setSelectedIndex(null);
  };

  const toggleCheck = (column: string, check: string) => {
    const key = `${column}::${check}`;
    setOpenChecks((prev) => ({ ...prev, [key]: !prev[key] }));
    setSelectedColumn(column);
    setSelectedCheck(check);
    setSelectedIndex(null);
  };

  const selectIssue = (column: string, check: string, indexValue: number | null) => {
    setSelectedColumn(column);
    setSelectedCheck(check);
    setSelectedIndex(indexValue);
    setOpenColumns((prev) => ({ ...prev, [column]: true }));
    setOpenChecks((prev) => ({ ...prev, [`${column}::${check}`]: true }));
  };

  const selectRow = (indexValue: number | null) => {
    setSelectedIndex(indexValue);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              Technical Data Quality
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Technical validation view</h1>
              <p className="text-sm text-slate-400">Optimized drill-down view for validation issues and linked source rows.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200">
            Backend rows loaded
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            Backend fetch failed: {error}. Fallback mock data is shown below.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Loading technical data from backend...</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {checkSummary.slice(0, 4).map((item) => (
            <CheckCard key={item.check} check={item.check} count={item.count} total={issueCount} />
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          {issueCount} validation issues across {checkSummary.length} check type{checkSummary.length === 1 ? '' : 's'}.
        </div>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Issue tree</h2>
                <p className="text-sm text-slate-400">column → check → index</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-slate-400" />
            </div>

            <div className="space-y-3 p-4">
              {reportColumns.length ? (
                reportColumns.map((columnGroup) => {
                  const isColumnOpen = Boolean(openColumns[columnGroup.column]);

                  return (
                    <div key={columnGroup.column} className="rounded-2xl border border-white/5 bg-white/5">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                        onClick={() => toggleColumn(columnGroup.column)}
                      >
                        <span className="font-medium text-white">{columnGroup.column}</span>
                        <span className="text-xs text-slate-400">{columnGroup.entries.length}</span>
                      </button>

                      {isColumnOpen ? (
                        <div className="space-y-2 border-t border-white/5 px-4 py-3">
                          {Object.values(columnGroup.checks).map((checkGroup) => {
                            const checkKey = `${columnGroup.column}::${checkGroup.check}`;
                            const isCheckOpen = Boolean(openChecks[checkKey]);

                            return (
                              <div key={checkKey} className="rounded-xl bg-black/20">
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                                  onClick={() => toggleCheck(columnGroup.column, checkGroup.check)}
                                >
                                  <span className="text-sm text-slate-200">{checkGroup.check}</span>
                                  <span className="text-xs text-slate-400">{checkGroup.entries.length}</span>
                                </button>

                                {isCheckOpen ? (
                                  <div className="space-y-2 px-3 pb-3">
                                    {checkGroup.entries.map((entry, idx) => {
                                      const rowIndex = normalizeIndex(entry.index);
                                      const active = selectedIndex === rowIndex;

                                      return (
                                        <button
                                          key={`${checkKey}-${idx}`}
                                          type="button"
                                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                                            active
                                              ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                                              : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
                                          }`}
                                          onClick={() => selectIssue(columnGroup.column, checkGroup.check, rowIndex)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>Index {formatCellValue(entry.index)}</span>
                                            <span className="truncate pl-3">{formatCellValue(entry.failure_case)}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-400">
                  No validation issues loaded.
                </div>
              )}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Drill-down details</h2>
                  <p className="text-sm text-slate-400">
                    Selected column: {selectedColumn || '—'} · check: {selectedCheck} · index: {selectedIndex ?? 'all'}
                  </p>
                </div>
                <FileSpreadsheet className="h-5 w-5 text-slate-400" />
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Column</p>
                  <p className="mt-1 text-sm text-white">{selectedEntry ? formatCellValue(selectedEntry.column) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Check</p>
                  <p className="mt-1 text-sm text-white">{selectedEntry ? formatCellValue(selectedEntry.check) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Failure case</p>
                  <p className="mt-1 text-sm text-white">{selectedEntry ? formatCellValue(selectedEntry.failure_case) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Index</p>
                  <p className="mt-1 text-sm text-white">{selectedEntry ? formatCellValue(selectedEntry.index) : '—'}</p>
                </div>
              </div>

              <div className="border-t border-white/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Linked row</h3>
                  <span className="text-xs text-slate-400">Row #{selectedRowIndex ?? '—'}</span>
                </div>

                {selectedRow ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {columns.map((column) => (
                      <div key={column} className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{column}</p>
                        <p className="mt-1 text-sm text-slate-200">{formatCellValue(selectedRow[column])}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-400">
                    No linked row available for this index.
                  </div>
                )}

                {selectedRowIssues.length ? (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-white">All issues for this row</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRowIssues.map((issue, idx) => (
                        <span
                          key={`${issue.check}-${idx}`}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                        >
                          {formatCellValue(issue.column)} · {formatCellValue(issue.check)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

          </main>
        </section>
      </div>
    </DashboardLayout>
  );
}
