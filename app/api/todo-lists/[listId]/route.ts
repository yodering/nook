import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

function parseListId(raw: string): string | null {
  if (!raw.startsWith("local-")) {
    return null;
  }
  const parsed = raw.slice("local-".length);
  return parsed || null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const parsedListId = parseListId(listId);
    if (!parsedListId) {
      return NextResponse.json({ error: "Invalid list id" }, { status: 400 });
    }

    const body = (await req.json()) as { name?: string; color?: string; sortOrder?: number };
    const updateData: { name?: string; color?: string; sortOrder?: number } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.color === "string" && body.color.trim()) {
      updateData.color = body.color.trim();
    }
    if (typeof body.sortOrder === "number") {
      updateData.sortOrder = body.sortOrder;
    }

    const list = await prisma.todoList.updateMany({
      where: { id: parsedListId, userId: user.id },
      data: updateData,
    });

    if (list.count === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update todo list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const parsedListId = parseListId(listId);
    if (!parsedListId) {
      return NextResponse.json({ error: "Invalid list id" }, { status: 400 });
    }

    const deleted = await prisma.todoList.deleteMany({
      where: { id: parsedListId, userId: user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete todo list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
