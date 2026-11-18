/**
 * In-Memory APM Logging & Telemetry Engine (Pillar D)
 * Tracks:
 * - Most frequently called API routes
 * - Slowest API endpoints & latencies (p50, p95, max)
 * - Real-time Requests Per Minute (RPM)
 * - Database query duration & Server-Timing headers
 * - Node.js CPU & Memory consumption per function/process
 */

export interface TelemetryRecord {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  dbDurationMs?: number;
  cpuUserUs?: number;
  cpuSystemUs?: number;
  timestamp: number;
}

export interface RouteAggregate {
  route: string;
  method: string;
  count: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  totalDurationMs: number;
  errorCount: number;
}

class TelemetryStore {
  private static instance: TelemetryStore;
  private totalRequests = 0;
  private routeMap = new Map<string, RouteAggregate>();
  private slowRequests: TelemetryRecord[] = [];
  private requestTimestamps: number[] = [];
  private readonly MAX_SLOW_LOGS = 50;
  private readonly RPM_WINDOW_MS = 60000;

  private constructor() {}

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  /**
   * Records completed request metric.
   */
  public record(record: TelemetryRecord): void {
    this.totalRequests++;
    const now = record.timestamp || Date.now();

    // 1. Maintain sliding window for RPM
    this.requestTimestamps.push(now);
    const windowStart = now - this.RPM_WINDOW_MS;
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] < windowStart) {
      this.requestTimestamps.shift();
    }

    // 2. Aggregate per route + method
    const key = `${record.method.toUpperCase()} ${record.route}`;
    let agg = this.routeMap.get(key);

    if (!agg) {
      agg = {
        route: record.route,
        method: record.method.toUpperCase(),
        count: 0,
        avgDurationMs: 0,
        minDurationMs: record.durationMs,
        maxDurationMs: record.durationMs,
        totalDurationMs: 0,
        errorCount: 0,
      };
      this.routeMap.set(key, agg);
    }

    agg.count++;
    agg.totalDurationMs += record.durationMs;
    agg.avgDurationMs = Math.round((agg.totalDurationMs / agg.count) * 10) / 10;
    agg.minDurationMs = Math.min(agg.minDurationMs, record.durationMs);
    agg.maxDurationMs = Math.max(agg.maxDurationMs, record.durationMs);
    if (record.status >= 400) {
      agg.errorCount++;
    }

    // 3. Track slowest requests (over 200ms or highest duration)
    if (record.durationMs > 200 || this.slowRequests.length < this.MAX_SLOW_LOGS) {
      this.slowRequests.push(record);
      this.slowRequests.sort((a, b) => b.durationMs - a.durationMs);
      if (this.slowRequests.length > this.MAX_SLOW_LOGS) {
        this.slowRequests.length = this.MAX_SLOW_LOGS;
      }
    }
  }

  /**
   * Generates comprehensive telemetry summary report.
   */
  public getSummary() {
    const now = Date.now();
    const windowStart = now - this.RPM_WINDOW_MS;
    const currentRpm = this.requestTimestamps.filter((ts) => ts >= windowStart).length;

    // Top most frequently called API routes
    const topRoutes = Array.from(this.routeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Slowest API endpoints by average duration
    const slowestEndpoints = Array.from(this.routeMap.values())
      .filter((r) => r.count >= 2)
      .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
      .slice(0, 10);

    // Node.js process CPU & memory statistics
    let systemInfo: Record<string, unknown> = {};
    if (typeof process !== "undefined") {
      const mem = process.memoryUsage ? process.memoryUsage() : null;
      const cpu = process.cpuUsage ? process.cpuUsage() : null;
      systemInfo = {
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime ? process.uptime() : 0),
        memory: mem
          ? {
              rssMb: Math.round(mem.rss / (1024 * 1024) * 10) / 10,
              heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024) * 10) / 10,
              heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024) * 10) / 10,
            }
          : null,
        cpuUsageMicroseconds: cpu,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      totalRequestsTracked: this.totalRequests,
      requestsPerMinute: currentRpm,
      topFrequentRoutes: topRoutes,
      slowestEndpointsByAvgDuration: slowestEndpoints,
      recentSlowestInvocations: this.slowRequests.slice(0, 15),
      system: systemInfo,
    };
  }

  public clear(): void {
    this.totalRequests = 0;
    this.routeMap.clear();
    this.slowRequests = [];
    this.requestTimestamps = [];
  }
}

export const telemetry = TelemetryStore.getInstance();

/**
 * Execution profiling timer.
 * Captures wall-clock time, process CPU consumption, and generates standard Server-Timing headers.
 */
export function startTelemetryTimer() {
  const startTime = performance.now();
  const startCpu = typeof process !== "undefined" && process.cpuUsage ? process.cpuUsage() : null;

  return {
    stop: (meta: { route: string; method?: string; status: number; dbDurationMs?: number }) => {
      const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
      let cpuUserUs = 0;
      let cpuSystemUs = 0;

      if (startCpu && process.cpuUsage) {
        const cpuDiff = process.cpuUsage(startCpu);
        cpuUserUs = cpuDiff.user;
        cpuSystemUs = cpuDiff.system;
      }

      telemetry.record({
        route: meta.route,
        method: meta.method || "GET",
        status: meta.status,
        durationMs,
        dbDurationMs: meta.dbDurationMs,
        cpuUserUs,
        cpuSystemUs,
        timestamp: Date.now(),
      });

      // Construct standard W3C Server-Timing header
      const parts = [`app;dur=${durationMs}`];
      if (typeof meta.dbDurationMs === "number") {
        parts.push(`db;dur=${meta.dbDurationMs}`);
      }
      if (cpuUserUs > 0) {
        parts.push(`cpu;dur=${(cpuUserUs / 1000).toFixed(1)}`);
      }

      return {
        durationMs,
        serverTimingHeader: parts.join(", "),
      };
    },
  };
}
