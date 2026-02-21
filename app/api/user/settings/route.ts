import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { settings: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return existing settings or defaults
        return NextResponse.json(currentUser.settings ?? {
            weekStartsOn: 1,
            sidebarOpen: true,
            theme: "light",
            timezone: "UTC",
            defaultEventDuration: 60,
        });
    } catch (error) {
        console.error("Failed to fetch user settings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            weekStartsOn,
            sidebarOpen,
            theme,
            timezone,
            defaultEventDuration,
        } = body as {
            weekStartsOn?: number;
            sidebarOpen?: boolean;
            theme?: string;
            timezone?: string;
            defaultEventDuration?: number;
        };

        const allowedThemes = new Set(["light", "dark", "system"]);
        if (theme !== undefined && !allowedThemes.has(theme)) {
            return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }

        const settings = await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {
                weekStartsOn: weekStartsOn !== undefined ? weekStartsOn : undefined,
                sidebarOpen: sidebarOpen !== undefined ? sidebarOpen : undefined,
                theme: theme !== undefined ? theme : undefined,
                timezone: timezone !== undefined ? timezone : undefined,
                defaultEventDuration:
                    defaultEventDuration !== undefined ? defaultEventDuration : undefined,
            },
            create: {
                userId: user.id,
                weekStartsOn: weekStartsOn ?? 1,
                sidebarOpen: sidebarOpen ?? true,
                theme: theme ?? "light",
                timezone: timezone ?? "UTC",
                defaultEventDuration: defaultEventDuration ?? 60,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Failed to update user settings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
