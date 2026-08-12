import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieData = req.cookies.get("data")?.value;
  const userData = cookieData ? JSON.parse(cookieData) : null;
  const token = userData?.access_token;

  try {
    const { selectedAnswers, paper_id } = await req.json();

    const response = await fetch(
      "https://eduvault-jadl.onrender.com/papers/submit/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: selectedAnswers, paper_id }),
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
  } catch {
    // This only triggers if the 'fetch' fails entirely (network error)
    return NextResponse.json(
      { error: "Service unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
