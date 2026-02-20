import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { calendarId, displayName, color, sortOrder, hidden, pinned } = body;

        if (!calendarId) {
            return NextResponse.json(
                { error: "calendarId is required" },
                { status: 400 }
            );
        }

        // Upsert the override
        const override = await prisma.calendarOverride.upsert({
            where: {
                userId_calendarId: {
                    userId: user.id,
                    calendarId,
                },
            },
            update: {
                displayName: displayName !== undefined ? displayName : undefined,
                color: color !== undefined ? color : undefined,
                sortOrder: sortOrder !== undefined ? sortOrder : undefined,
                hidden: hidden !== undefined ? hidden : undefined,
                pinned: pinned !== undefined ? pinned : undefined,
            },
            create: {
                userId: user.id,
                calendarId,
                displayName,
                color,
                sortOrder: sortOrder ?? 0,
                hidden: hidden ?? false,
                pinned: pinned ?? false,
            },
        });

        return NextResponse.json(override);
    } catch (error) {
        console.error("Failed to update calendar preferences:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
