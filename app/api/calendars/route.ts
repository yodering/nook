import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchCalendars } from "@/lib/google-calendar";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
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
        const googleCalendars = await fetchCalendars(session.accessToken as string);

        // Merge Google Calendars with DB overrides
        const mergedCalendars = googleCalendars.map((gCal: any) => {
            const override = user.overrides.find((o: any) => o.calendarId === gCal.id);
            return {
                id: gCal.id,
                name: override?.displayName ?? gCal.name,
                color: override?.color ?? gCal.color,
                sortOrder: override?.sortOrder ?? 0,
                hidden: override?.hidden ?? false,
                pinned: override?.pinned ?? false,
            };
        });

        // Sort: pinned first, then by sortOrder, then by name
        mergedCalendars.sort((a: any, b: any) => {
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
