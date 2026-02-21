"use client";

import { useCallback, useEffect, useState } from "react";
import { WeekHeader } from "./week-header";
import { Sidebar } from "./sidebar";
import { WeekGrid } from "./week-grid";
import { navigateWeek } from "@/lib/calendar-data";
import { useTheme } from "next-themes";
import type {
  CalendarEvent,
  Module,
  Todo,
  TodoList,
  WeekCalendarPayload,
} from "@/lib/calendar-data";

export function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let ignore = false;

    async function loadUserSettings() {
      try {
        const response = await fetch("/api/user/settings", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          sidebarOpen?: boolean;
          theme?: "light" | "dark" | "system";
        };

        if (ignore) {
          return;
        }

        if (typeof data.sidebarOpen === "boolean") {
          setSidebarOpen(data.sidebarOpen);
        }
        if (data.theme) {
          setTheme(data.theme);
        }
      } catch {
        // Ignore settings bootstrap errors and keep local defaults.
      }
    }

    loadUserSettings();

    return () => {
      ignore = true;
    };
  }, [setTheme]);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadWeekData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [weekResponse, listResponse, todoResponse] = await Promise.all([
          fetch(
            `/api/calendar/week?date=${encodeURIComponent(currentDate.toISOString())}`,
            {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }
          ),
          fetch("/api/todo-lists", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/todos", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (!weekResponse.ok) {
          throw new Error(`Request failed (${weekResponse.status})`);
        }
        if (!listResponse.ok) {
          throw new Error(`Todo lists request failed (${listResponse.status})`);
        }
        if (!todoResponse.ok) {
          throw new Error(`Todos request failed (${todoResponse.status})`);
        }

        const [weekData, localLists, localTodos] = (await Promise.all([
          weekResponse.json(),
          listResponse.json(),
          todoResponse.json(),
        ])) as [WeekCalendarPayload, TodoList[], Todo[]];

        if (ignore) {
          return;
        }

        setModules(weekData.modules);
        setEvents(weekData.events);
        setTodoLists([
          ...weekData.todoLists,
          ...localLists,
        ]);
        setTodos([...weekData.todos, ...localTodos]);
      } catch (error) {
        if (ignore || controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Failed to sync Google Calendar.";
        setLoadError(message);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadWeekData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentDate]);

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => navigateWeek(d, "prev"));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => navigateWeek(d, "next"));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleWeekSelect = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleToggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      const target = next.find((todo) => todo.id === id);
      if (target?.source === "local") {
        fetch(`/api/todos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: target.completed }),
        }).catch(() => {
          // Best effort. UI already applied optimistic update.
        });
      }
      return next;
    });
  }, []);

  const handleRemoveTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const target = prev.find((todo) => todo.id === id);
      if (target?.source === "local") {
        fetch(`/api/todos/${id}`, {
          method: "DELETE",
        }).catch(() => {
          // Best effort. UI already removed item.
        });
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const handleAddTodo = useCallback((text: string, listId: string) => {
    if (!listId.startsWith("local-")) {
      const localOnlyTodo: Todo = {
        id: `temp-${Date.now()}`,
        text,
        listId,
        completed: false,
        source: "google",
      };
      setTodos((prev) => [localOnlyTodo, ...prev]);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: Todo = {
      id: tempId,
      text,
      listId,
      completed: false,
      source: "local",
    };
    setTodos((prev) => [optimisticTodo, ...prev]);

    fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, listId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to create todo");
        }
        const created = (await response.json()) as Todo;
        setTodos((prev) => prev.map((todo) => (todo.id === tempId ? created : todo)));
      })
      .catch(() => {
        setTodos((prev) => prev.filter((todo) => todo.id !== tempId));
      });
  }, []);

  const handleAddList = useCallback((name: string, color: string) => {
    const tempId = `local-temp-${Date.now()}`;
    const optimisticList: TodoList = {
      id: tempId,
      name,
      color,
    };
    setTodoLists((prev) => [...prev, optimisticList]);

    fetch("/api/todo-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to create list");
        }
        const created = (await response.json()) as TodoList;
        setTodoLists((prev) => prev.map((list) => (list.id === tempId ? created : list)));
      })
      .catch(() => {
        setTodoLists((prev) => prev.filter((list) => list.id !== tempId));
      });
  }, []);

  const handleDeleteList = useCallback((listId: string) => {
    if (!listId.startsWith("local-")) {
      return;
    }

    setTodoLists((prev) => prev.filter((l) => l.id !== listId));
    setTodos((prev) => prev.filter((t) => t.listId !== listId));
    fetch(`/api/todo-lists/${listId}`, {
      method: "DELETE",
    }).catch(() => {
      // Best effort; data will resync on next page load.
    });
  }, []);

  const handleRenameList = useCallback((listId: string, name: string) => {
    if (listId.startsWith("local-")) {
      setTodoLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, name } : l))
      );
      fetch(`/api/todo-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).catch(() => {
        // Best effort; data will resync on next page load.
      });
      return;
    }

    const targetList = todoLists.find((list) => list.id === listId);
    if (targetList?.moduleId) {
      setModules((prev) =>
        prev.map((module) =>
          module.id === targetList.moduleId ? { ...module, name } : module
        )
      );
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: targetList.moduleId,
          displayName: name,
        }),
      }).catch(() => {
        // Best effort; data will resync on next page load.
      });
    }
    setTodoLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, name } : l))
    );
  }, [todoLists]);

  const handleRecolorList = useCallback((listId: string, color: string) => {
    if (listId.startsWith("local-")) {
      setTodoLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, color } : l))
      );
      fetch(`/api/todo-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      }).catch(() => {
        // Best effort; data will resync on next page load.
      });
      return;
    }

    const targetList = todoLists.find((list) => list.id === listId);
    if (targetList?.moduleId) {
      setModules((prev) =>
        prev.map((module) =>
          module.id === targetList.moduleId ? { ...module, color } : module
        )
      );
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: targetList.moduleId,
          color,
        }),
      }).catch(() => {
        // Best effort; data will resync on next page load.
      });
    }
    setTodoLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, color } : l))
    );
  }, [todoLists]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme: "light" | "dark" = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    }).catch(() => {
      // Keep optimistic theme update.
    });
  }, [setTheme, theme]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((previous) => {
      const next = !previous;
      fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidebarOpen: next }),
      }).catch(() => {
        // Keep optimistic sidebar update.
      });
      return next;
    });
  }, []);

  return (
    <div className="nook-calendar-shell">
      <div className="nook-calendar-frame">
        <WeekHeader
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onToggleTheme={handleToggleTheme}
          theme={theme === "dark" ? "dark" : "light"}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            currentDate={currentDate}
            onWeekSelect={handleWeekSelect}
            todoLists={todoLists}
            todos={todos}
            onToggleTodo={handleToggleTodo}
            onRemoveTodo={handleRemoveTodo}
            onAddTodo={handleAddTodo}
            onAddList={handleAddList}
            onDeleteList={handleDeleteList}
            onRenameList={handleRenameList}
            onRecolorList={handleRecolorList}
          />

          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--card)]">
            {loadError && (
              <div className="mx-3 mt-3 rounded-xl border border-[var(--destructive)]/35 bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--destructive)]">
                couldn&apos;t sync google calendar: {loadError}
              </div>
            )}
            <WeekGrid currentDate={currentDate} events={events} modules={modules} />
            {isLoading && (
              <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] shadow-sm">
                syncing...
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
