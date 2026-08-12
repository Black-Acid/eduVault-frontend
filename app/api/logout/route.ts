import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create a NextResponse to delete the cookie
    const res = NextResponse.json({ message: "Sign out successful" });

    // Delete the 'data' cookie by setting it with an expired date
    res.cookies.delete("data");

    // Return the response indicating successful sign-out
    return res;
  } catch {
    // Handle any unexpected errors
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
