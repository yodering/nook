import { addMinutes, differenceInCalendarDays, startOfWeek } from "date-fns";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@/lib/google-calendar";

function toRecurrenceRule(value: string): string[] | undefined {
  switch (value) {
    case "daily":
      return ["RRULE:FREQ=DAILY"];
    case "weekdays":
      return ["RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"];
    case "weekly":
      return ["RRULE:FREQ=WEEKLY"];
    case "monthly":
      return ["RRULE:FREQ=MONTHLY"];
    case "yearly":
      return ["RRULE:FREQ=YEARLY"];
    default:
      return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      calendarId?: string;
      title?: string;
      start?: string;
      durationMinutes?: number;
      timeZone?: string;
      recurrence?: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
      colorId?: string;
    };

    if (!body.calendarId || !body.start || !body.durationMinutes) {
      return NextResponse.json(
        { error: "calendarId, start, and durationMinutes are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const endDate = addMinutes(startDate, body.durationMinutes);
    const created = await createGoogleCalendarEvent({
      accessToken: session.accessToken,
      calendarId: body.calendarId,
      title: body.title?.trim() || "untitled event",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeZone: body.timeZone || "UTC",
      colorId: body.colorId,
      recurrence: toRecurrenceRule(body.recurrence || "none"),
    });

    const createdStart = created.start?.dateTime ? new Date(created.start.dateTime) : startDate;
    const createdEnd = created.end?.dateTime ? new Date(created.end.dateTime) : endDate;
    const weekStart = startOfWeek(createdStart, { weekStartsOn: 1 });
    const dayOffset = differenceInCalendarDays(createdStart, weekStart);

    return NextResponse.json({
      id: `${body.calendarId}:${created.id ?? `${Date.now()}`}`,
      title: created.summary?.trim() || body.title?.trim() || "untitled event",
      moduleId: body.calendarId,
      dayOffset,
      startHour: createdStart.getHours(),
      startMinute: createdStart.getMinutes(),
      endHour: createdEnd.getHours(),
      endMinute: createdEnd.getMinutes(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create event", details: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      calendarId?: string;
      eventId?: string;
      title?: string;
      start?: string;
      durationMinutes?: number;
      timeZone?: string;
      recurrence?: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
      colorId?: string;
    };

    if (!body.calendarId || !body.eventId || !body.start || !body.durationMinutes) {
      return NextResponse.json(
        { error: "calendarId, eventId, start, and durationMinutes are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const endDate = addMinutes(startDate, body.durationMinutes);
    const updated = await updateGoogleCalendarEvent({
      accessToken: session.accessToken,
      calendarId: body.calendarId,
      eventId: body.eventId,
      title: body.title?.trim() || "untitled event",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeZone: body.timeZone || "UTC",
      colorId: body.colorId,
      recurrence:
        body.recurrence && body.recurrence !== "none"
          ? toRecurrenceRule(body.recurrence)
          : undefined,
    });

    const updatedStart = updated.start?.dateTime ? new Date(updated.start.dateTime) : startDate;
    const updatedEnd = updated.end?.dateTime ? new Date(updated.end.dateTime) : endDate;
    const weekStart = startOfWeek(updatedStart, { weekStartsOn: 1 });
    const dayOffset = differenceInCalendarDays(updatedStart, weekStart);

    return NextResponse.json({
      id: `${body.calendarId}:${body.eventId}`,
      title: updated.summary?.trim() || body.title?.trim() || "untitled event",
      moduleId: body.calendarId,
      dayOffset,
      startHour: updatedStart.getHours(),
      startMinute: updatedStart.getMinutes(),
      endHour: updatedEnd.getHours(),
      endMinute: updatedEnd.getMinutes(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update event", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { calendarId?: string; eventId?: string };
    if (!body.calendarId || !body.eventId) {
      return NextResponse.json(
        { error: "calendarId and eventId are required" },
        { status: 400 }
      );
    }

    await deleteGoogleCalendarEvent({
      accessToken: session.accessToken,
      calendarId: body.calendarId,
      eventId: body.eventId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete event", details: message },
      { status: 500 }
    );
  }
}
