import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/server-auth";
import { telemetry } from "@/lib/telemetry/metrics";

export const dynamic = "force-dynamic";

/**
 * Real-time APM Telemetry Endpoint (Pillar D)
 * Reports:
 * - Most frequently called API routes
 * - Slowest endpoints by average and max latency
 * - Requests per minute (RPM)
 * - Database query duration & server timing
 * - CPU consumption and memory usage
 */
export async function GET() {
  const auth = await requireStaff();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const summary = telemetry.getSummary();
  return NextResponse.json({
    success: true,
    telemetry: summary,
  });
}
