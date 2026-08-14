import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const response = await fetch(
      "https://eduvault-jadl.onrender.com/auth/login/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
    );

    // Parse the JSON response from the external API
    const data = await response.json();

    // Handle non-200 responses from the external API
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message || data.error || data.detail || "Invalid Credentials",
        },
        { status: response.status },
      );
    }

    // Create a NextResponse to set the cookie
    const res = NextResponse.json(data);

    // Store the entire login data as a JSON string in the cookie
    res.cookies.set("data", JSON.stringify(data), {
      maxAge: 60 * 60 * 2,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

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
