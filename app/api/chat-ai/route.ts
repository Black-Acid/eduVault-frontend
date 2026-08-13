import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieData = req.cookies.get("data")?.value;
  const userData = cookieData ? JSON.parse(cookieData) : null;
  const token = userData?.access_token;

  try {
    const { attempt_id, question_id } = await req.json();

    const response = await fetch(
      "https://eduvault-jadl.onrender.com/ai/explain/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attempt_id, question_id }),
      },
    );

    // Parse the JSON response from the external API
    const data = await response.json();

    // Handle non-200 responses from the external API
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            data.detail ||
            "Could not fetch answers",
        },
        { status: response.status },
      );
    }

    // Create a NextResponse to set the cookie
    const res = NextResponse.json(data);

    // Return the successful response
    return res;
  } catch (error) {
    // LOG THE ACTUAL ERROR TO YOUR TERMINAL INSTEAD OF HIDING IT
    console.error("API Route Internal Error:", error);
    // return NextResponse.json(
    //   { error: "Service unavailable. Please try again later." },
    //   { status: 503 },
    // );
  }
}
