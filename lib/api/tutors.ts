import { apiFetch } from "./client";
import { COLD_START_TIMEOUT_MS } from "./config";
import { tutorListSchema, type Tutor } from "./schemas";

/**
 * `GET /tutors` - public.
 *
 * Availability and ratings change independently of any deploy, so this is not
 * cached.
 */
export async function getTutors(): Promise<Tutor[]> {
  return apiFetch("/tutors", {
    schema: tutorListSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    cache: "no-store",
  });
}
