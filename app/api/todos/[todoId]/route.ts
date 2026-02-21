import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { parseSmartSchedule } from "@/lib/todo-scheduling";

function parseTodoId(raw: string): string | null {
  if (!raw.startsWith("task-")) {
    return null;
  }
  const parsed = raw.slice("task-".length);
  return parsed || null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ todoId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { todoId } = await params;
    const parsedTodoId = parseTodoId(todoId);
    if (!parsedTodoId) {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    const body = (await req.json()) as { completed?: boolean; text?: string };
    const updateData: {
      completed?: boolean;
      completedAt?: Date | null;
      text?: string;
      dueAt?: Date | null;
      scheduleToken?: string | null;
    } = {};

    if (typeof body.completed === "boolean") {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
    }

    if (typeof body.text === "string" && body.text.trim()) {
      const parsed = parseSmartSchedule(body.text.trim());
      updateData.text = parsed.text;
      updateData.dueAt = parsed.dueAt;
      updateData.scheduleToken = parsed.scheduleToken;
    }

    const updated = await prisma.todoItem.updateMany({
      where: {
        id: parsedTodoId,
        userId: user.id,
      },
      data: updateData,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ todoId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { todoId } = await params;
    const parsedTodoId = parseTodoId(todoId);
    if (!parsedTodoId) {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    const deleted = await prisma.todoItem.deleteMany({
      where: {
        id: parsedTodoId,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
