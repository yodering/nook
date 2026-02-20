import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeekCalendarPayload } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const anchorDate = dateParam ? new Date(dateParam) : new Date();

  if (Number.isNaN(anchorDate.getTime())) {
    return NextResponse.json({ error: "Invalid date query parameter" }, { status: 400 });
  }

  try {
    const payload = await getWeekCalendarPayload(session.accessToken, anchorDate);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load calendar data", details: message },
      { status: 500 }
    );
  }
}
