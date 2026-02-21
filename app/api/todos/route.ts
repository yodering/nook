import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { parseSmartSchedule } from "@/lib/todo-scheduling";

type TodoResponse = {
  id: string;
  text: string;
  listId: string;
  completed: boolean;
  dueAt: string | null;
  scheduleToken: string | null;
  source: "local";
};

function toClientTodo(todo: {
  id: string;
  text: string;
  listId: string;
  completed: boolean;
  dueAt: Date | null;
  scheduleToken: string | null;
}): TodoResponse {
  return {
    id: `task-${todo.id}`,
    text: todo.text,
    listId: `local-${todo.listId}`,
    completed: todo.completed,
    dueAt: todo.dueAt ? todo.dueAt.toISOString() : null,
    scheduleToken: todo.scheduleToken,
    source: "local",
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = await prisma.todoItem.findMany({
      where: {
        userId: user.id,
        completed: false,
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(todos.map(toClientTodo));
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      text?: string;
      listId?: string;
    };
    const rawText = body.text?.trim();
    if (!rawText) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const rawListId = body.listId?.trim();
    if (!rawListId || !rawListId.startsWith("local-")) {
      return NextResponse.json(
        { error: "listId is required and must reference a local list" },
        { status: 400 },
      );
    }

    const listId = rawListId.slice("local-".length);
    const list = await prisma.todoList.findFirst({
      where: { id: listId, userId: user.id },
      select: { id: true },
    });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const parsed = parseSmartSchedule(rawText);
    const todo = await prisma.todoItem.create({
      data: {
        userId: user.id,
        listId: list.id,
        text: parsed.text,
        dueAt: parsed.dueAt,
        scheduleToken: parsed.scheduleToken,
      },
    });

    return NextResponse.json(toClientTodo(todo), { status: 201 });
  } catch (error) {
    console.error("Failed to create todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
