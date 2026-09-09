import { apiFetch } from "./client";
import { COLD_START_TIMEOUT_MS } from "./config";
import { dashboardResponseSchema, type DashboardResponse } from "./schemas";

/**
 * `GET /dashboard?year=&month=` - protected.
 *
 * The backend derives the user from the bearer token (`current_user`); no
 * user id is ever sent from the client. `year`/`month` scope the monthly
 * activity calendar only - every other figure is lifetime-to-date. See
 * docs/API_INTEGRATION.md.
 */
export async function getDashboard(
  token: string,
  year: number,
  month: number,
): Promise<DashboardResponse> {
  return apiFetch("/dashboard", {
    token,
    query: { year, month },
    schema: dashboardResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    cache: "no-store",
  });
}
