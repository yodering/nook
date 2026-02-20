import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { settings: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return existing settings or defaults
        return NextResponse.json(user.settings ?? {
            weekStartsOn: 1,
            sidebarOpen: true
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
        const { weekStartsOn, sidebarOpen } = body;

        const settings = await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {
                weekStartsOn: weekStartsOn !== undefined ? weekStartsOn : undefined,
                sidebarOpen: sidebarOpen !== undefined ? sidebarOpen : undefined,
            },
            create: {
                userId: user.id,
                weekStartsOn: weekStartsOn ?? 1,
                sidebarOpen: sidebarOpen ?? true,
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
