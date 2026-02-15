type HttpMetricInput = {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type RouteSnapshot = {
  route: string;
  count: number;
  errorRatePercent: number;
  p95Ms: number;
  avgMs: number;
  maxMs: number;
};

type ReliabilitySnapshot = {
  generatedAt: string;
  processUptimeSeconds: number;
  requestVolume: {
    total: number;
    errors: number;
    errorRatePercent: number;
    availabilityPercent: number;
  };
  latency: {
    avgMs: number;
    p95Ms: number;
    p99Ms: number;
    maxMs: number;
  };
  sloTargets: {
    availabilityPercent: number;
    p95Ms: number;
  };
  burn: {
    availabilityGapPercent: number;
    latencyGapMs: number;
  };
  statusBreakdown: Record<string, number>;
  topSlowRoutes: RouteSnapshot[];
  topErrorRoutes: RouteSnapshot[];
  activeRoutes: number;
};

type RouteMetricState = {
  count: number;
  errors: number;
  totalDurationMs: number;
  maxDurationMs: number;
  durationsMs: number[];
};

const MAX_GLOBAL_SAMPLES = 5000;
const MAX_ROUTE_SAMPLES = 600;

const DEFAULT_SLO_TARGETS = {
  availabilityPercent: 99.95,
  p95Ms: 300,
} as const;

const round = (value: number): number => Math.round(value * 100) / 100;

const percentile = (samples: number[], p: number): number => {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
};

const normalizePath = (rawPath: string): string => {
  const basePath = (rawPath || '/').split('?')[0] || '/';

  return basePath
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(
      /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}(?=\/|$)/g,
      '/:id',
    )
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id');
};

class HttpMetricsStore {
  private totalRequests = 0;

  private totalErrors = 0;

  private totalDurationMs = 0;

  private maxDurationMs = 0;

  private statusCounts = new Map<number, number>();

  private durationsMs: number[] = [];

  private routeMetrics = new Map<string, RouteMetricState>();

  record(input: HttpMetricInput): void {
    const safeDurationMs = Number.isFinite(input.durationMs)
      ? Math.max(0, input.durationMs)
      : 0;

    this.totalRequests += 1;
    this.totalDurationMs += safeDurationMs;
    this.maxDurationMs = Math.max(this.maxDurationMs, safeDurationMs);

    this.durationsMs.push(safeDurationMs);
    if (this.durationsMs.length > MAX_GLOBAL_SAMPLES) {
      this.durationsMs.shift();
    }

    const statusCode = Number.isFinite(input.statusCode) ? input.statusCode : 500;
    this.statusCounts.set(statusCode, (this.statusCounts.get(statusCode) || 0) + 1);

    const isError = statusCode >= 500;
    if (isError) this.totalErrors += 1;

    const routeKey = `${input.method.toUpperCase()} ${normalizePath(input.path)}`;
    const routeState = this.routeMetrics.get(routeKey) || {
      count: 0,
      errors: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      durationsMs: [],
    };

    routeState.count += 1;
    routeState.totalDurationMs += safeDurationMs;
    routeState.maxDurationMs = Math.max(routeState.maxDurationMs, safeDurationMs);
    routeState.durationsMs.push(safeDurationMs);
    if (routeState.durationsMs.length > MAX_ROUTE_SAMPLES) {
      routeState.durationsMs.shift();
    }
    if (isError) routeState.errors += 1;

    this.routeMetrics.set(routeKey, routeState);
  }

  snapshot(): ReliabilitySnapshot {
    const total = this.totalRequests;
    const errors = this.totalErrors;
    const availabilityPercent =
      total === 0 ? 100 : round(((total - errors) / total) * 100);
    const errorRatePercent = total === 0 ? 0 : round((errors / total) * 100);
    const avgMs = total === 0 ? 0 : round(this.totalDurationMs / total);
    const p95Ms = round(percentile(this.durationsMs, 95));
    const p99Ms = round(percentile(this.durationsMs, 99));

    const statusBreakdown: Record<string, number> = {};
    for (const [status, count] of this.statusCounts.entries()) {
      statusBreakdown[String(status)] = count;
    }

    const routeSnapshots = Array.from(this.routeMetrics.entries()).map(
      ([route, state]) => ({
        route,
        count: state.count,
        errorRatePercent: state.count === 0 ? 0 : round((state.errors / state.count) * 100),
        p95Ms: round(percentile(state.durationsMs, 95)),
        avgMs: state.count === 0 ? 0 : round(state.totalDurationMs / state.count),
        maxMs: round(state.maxDurationMs),
      }),
    );

    const topSlowRoutes = [...routeSnapshots]
      .filter((route) => route.count >= 5)
      .sort((a, b) => b.p95Ms - a.p95Ms)
      .slice(0, 7);

    const topErrorRoutes = [...routeSnapshots]
      .filter((route) => route.count >= 5 && route.errorRatePercent > 0)
      .sort((a, b) => b.errorRatePercent - a.errorRatePercent)
      .slice(0, 7);

    return {
      generatedAt: new Date().toISOString(),
      processUptimeSeconds: Math.floor(process.uptime()),
      requestVolume: {
        total,
        errors,
        errorRatePercent,
        availabilityPercent,
      },
      latency: {
        avgMs,
        p95Ms,
        p99Ms,
        maxMs: round(this.maxDurationMs),
      },
      sloTargets: {
        availabilityPercent: DEFAULT_SLO_TARGETS.availabilityPercent,
        p95Ms: DEFAULT_SLO_TARGETS.p95Ms,
      },
      burn: {
        availabilityGapPercent: round(
          Math.max(0, DEFAULT_SLO_TARGETS.availabilityPercent - availabilityPercent),
        ),
        latencyGapMs: round(Math.max(0, p95Ms - DEFAULT_SLO_TARGETS.p95Ms)),
      },
      statusBreakdown,
      topSlowRoutes,
      topErrorRoutes,
      activeRoutes: routeSnapshots.length,
    };
  }

  resetForTests(): void {
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.totalDurationMs = 0;
    this.maxDurationMs = 0;
    this.statusCounts.clear();
    this.durationsMs = [];
    this.routeMetrics.clear();
  }
}

export const httpMetricsStore = new HttpMetricsStore();

export type { HttpMetricInput, ReliabilitySnapshot, RouteSnapshot };
