import { NextResponse } from "next/server";
import { z } from "zod";

import { explainWrongAnswer } from "~/lib/api/ai";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { requireSession } from "~/lib/auth/session";

const explainBodySchema = z.object({
  attempt_id: z.number().int().positive(),
  question_id: z.number().int().positive(),
});

/**
 * `POST /ai/explain` proxy.
 *
 * Every path returns a Response - the previous implementation had a catch
 * branch that fell through and returned undefined, which surfaced as an opaque
 * runtime failure. Upstream 401/422/500 are mapped to the matching status
 * rather than being reported as success.
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await parseJsonBody(request, explainBodySchema);

    const explanation = await explainWrongAnswer(
      session.accessToken,
      body.attempt_id,
      body.question_id,
    );

    return NextResponse.json(explanation);
  } catch (error) {
    return errorResponse(error);
  }
}
