import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

function toClientList(list: { id: string; name: string; color: string }) {
  return {
    id: `local-${list.id}`,
    name: list.name,
    color: list.color,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await prisma.todoList.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(lists.map(toClientList));
  } catch (error) {
    console.error("Failed to fetch todo lists:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { name?: string; color?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const color = body.color?.trim() || "#6f8c5c";

    const currentMax = await prisma.todoList.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (currentMax._max.sortOrder ?? -1) + 1;

    const created = await prisma.todoList.create({
      data: {
        userId: user.id,
        name,
        color,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(toClientList(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create todo list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
