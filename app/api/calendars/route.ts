import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchCalendars } from "@/lib/google-calendar";

type MergedCalendar = {
    id: string;
    name: string;
    color: string | null;
    sortOrder: number;
    hidden: boolean;
    pinned: boolean;
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email || !session.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { overrides: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Explicitly pass the user's access token to the Google Calendar API call
        const googleCalendars = await fetchCalendars(session.accessToken);

        // Merge Google Calendars with DB overrides
        const mergedCalendars: MergedCalendar[] = googleCalendars
            .filter((gCal) => Boolean(gCal.id))
            .map((gCal) => {
            const calendarId = gCal.id as string;
            const override = user.overrides.find((o) => o.calendarId === calendarId);
            return {
                id: calendarId,
                name: override?.displayName ?? gCal.summary ?? "untitled",
                color: override?.color ?? gCal.backgroundColor ?? null,
                sortOrder: override?.sortOrder ?? 0,
                hidden: override?.hidden ?? false,
                pinned: override?.pinned ?? false,
            };
        });

        // Sort: pinned first, then by sortOrder, then by name
        mergedCalendars.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(mergedCalendars);
    } catch (error) {
        console.error("Failed to fetch calendars:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
