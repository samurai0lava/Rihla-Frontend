import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  checkAllMicroservices,
  getMicroserviceTargets,
  type HealthCheckResult,
} from '@/lib/microserviceHealth';

const AUTO_REFRESH_MS = 30_000;

function HealthcheckPage() {
  const [results, setResults] = useState<HealthCheckResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const runChecks = useCallback(async () => {
    setLoading(true);
    const pending = getMicroserviceTargets().map((t) => ({
      id: t.id,
      label: t.label,
      url: `${t.baseUrl.replace(/\/$/, '')}/health`,
      status: 'pending' as const,
    }));
    setResults(pending);
    try {
      const next = await checkAllMicroservices();
      setResults(next);
      setLastRun(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void runChecks();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, runChecks]);

  const okCount =
    results?.filter((r) => r.status === 'ok').length ?? 0;
  const total = results?.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Service status
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live checks against each backend <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /health</code> endpoint (same base URLs as{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_*</code> in the frontend).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="accent-primary h-4 w-4 rounded border-border"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh ({AUTO_REFRESH_MS / 1000}s)
            </label>
            <button
              type="button"
              onClick={() => void runChecks()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
            <Link
              to="/"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <div
          className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          {loading && results?.every((r) => r.status === 'pending') ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span>Checking services…</span>
            </>
          ) : (
            <>
              {okCount === total && total > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              <span>
                <strong>{okCount}</strong> of <strong>{total}</strong> healthy
              </span>
              {lastRun && (
                <span className="text-muted-foreground">
                  · Last run {lastRun.toLocaleTimeString()}
                </span>
              )}
            </>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-1">
          {(results ?? []).map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {row.status === 'pending' && (
                    <Loader2
                      className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  {row.status === 'ok' && (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  )}
                  {row.status === 'error' && (
                    <XCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                      aria-hidden
                    />
                  )}
                  <div>
                    <h2 className="font-semibold leading-tight">{row.label}</h2>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 break-all text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {row.url}
                    </a>
                  </div>
                </div>
                <div className="text-right text-sm tabular-nums text-muted-foreground">
                  {row.httpStatus != null && (
                    <div>HTTP {row.httpStatus}</div>
                  )}
                  {row.latencyMs != null && (
                    <div>{row.latencyMs} ms</div>
                  )}
                </div>
              </div>
              {row.error && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {row.error}
                </p>
              )}
              {row.bodySnippet && (
                <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {row.bodySnippet}
                </pre>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          If every check fails from the browser, verify CORS on each service and that{' '}
          <code className="rounded bg-muted px-1">VITE_*</code> URLs match where APIs are reachable.
        </p>
      </main>
    </div>
  );
}

export default HealthcheckPage;
