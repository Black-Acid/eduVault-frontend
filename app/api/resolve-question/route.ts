import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question_id, attempt_id } = await request.json();
    const cookieStore = await cookies();
    const dataCookie = cookieStore.get("quiz_results")?.value;

    if (!dataCookie) {
      return NextResponse.json(
        { error: "No quiz data found" },
        { status: 400 },
      );
    }

    let quiz_results = JSON.parse(dataCookie);

    // Update the specific question's is_resolved status to true
    quiz_results = quiz_results.map(
      (q: { question_id: number; attempt_id: number }) => {
        if (q.question_id === question_id && q.attempt_id === attempt_id) {
          return { ...q, is_resolved: true };
        }
        return q;
      },
    );

    // Save back to cookies (expires in 1 day or as needed)
    cookieStore.set("quiz_results", JSON.stringify(quiz_results), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ success: true, quiz_results });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
