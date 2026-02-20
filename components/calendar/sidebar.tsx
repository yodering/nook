"use client";

import { MiniCalendar } from "./mini-calendar";
import { TodoListPanel } from "./todo-list";
import type { Todo, TodoList } from "@/lib/calendar-data";

interface SidebarProps {
  isOpen: boolean;
  currentDate: Date;
  onWeekSelect: (date: Date) => void;
  todoLists: TodoList[];
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onRemoveTodo: (id: string) => void;
  onAddTodo: (text: string, listId: string) => void;
  onAddList: (name: string, color: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, name: string) => void;
  onRecolorList: (listId: string, color: string) => void;
}

export function Sidebar({
  isOpen,
  currentDate,
  onWeekSelect,
  todoLists,
  todos,
  onToggleTodo,
  onRemoveTodo,
  onAddTodo,
  onAddList,
  onDeleteList,
  onRenameList,
  onRecolorList,
}: SidebarProps) {
  return (
    <aside
      className={`shrink-0 overflow-hidden border-r border-[var(--sidebar-border)] transition-[width,opacity] duration-300 ease-out ${
        isOpen ? "w-[300px] opacity-100" : "w-0 opacity-0"
      }`}
      aria-label="Sidebar"
    >
      <div className="flex h-full w-[300px] flex-col bg-[var(--sidebar-bg)]">
        <MiniCalendar currentDate={currentDate} onWeekSelect={onWeekSelect} />
        <div className="mx-3 my-2 border-t border-[var(--border)]" />
        <TodoListPanel
          todoLists={todoLists}
          todos={todos}
          onToggle={onToggleTodo}
          onRemoveTodo={onRemoveTodo}
          onAdd={onAddTodo}
          onAddList={onAddList}
          onDeleteList={onDeleteList}
          onRenameList={onRenameList}
          onRecolorList={onRecolorList}
        />
      </div>
    </aside>
  );
}
