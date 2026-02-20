"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WeekHeader } from "./week-header";
import { Sidebar } from "./sidebar";
import { WeekGrid } from "./week-grid";
import { navigateWeek } from "@/lib/calendar-data";
import type {
  CalendarEvent,
  Module,
  Todo,
  TodoList,
  WeekCalendarPayload,
} from "@/lib/calendar-data";

const LIST_PREFERENCES_STORAGE_KEY = "nook:list-preferences:v1";

interface ListPreference {
  color?: string;
  name?: string;
}

type ListPreferences = Record<string, ListPreference>;

function getPreferenceKeyFromList(list: Pick<TodoList, "id" | "moduleId">): string {
  if (list.moduleId) {
    return list.moduleId;
  }
  return list.id.startsWith("list-") ? list.id.slice(5) : list.id;
}

function applyListPreferencesToModules(
  modules: Module[],
  preferences: ListPreferences
): Module[] {
  return modules.map((module) => {
    const preference = preferences[module.id];
    return {
      ...module,
      name: preference?.name?.trim() || module.name,
      color: preference?.color || module.color,
    };
  });
}

function applyListPreferencesToTodoLists(
  todoLists: TodoList[],
  preferences: ListPreferences
): TodoList[] {
  return todoLists.map((list) => {
    const preferenceKey = getPreferenceKeyFromList(list);
    const preference = preferences[preferenceKey];
    return {
      ...list,
      name: preference?.name?.trim() || list.name,
      color: preference?.color || list.color,
    };
  });
}

export function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listPreferences, setListPreferences] = useState<ListPreferences>({});
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const listPreferencesRef = useRef<ListPreferences>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIST_PREFERENCES_STORAGE_KEY);
      if (!raw) {
        setPreferencesLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw) as ListPreferences;
      setListPreferences(parsed);
    } catch {
      setListPreferences({});
    } finally {
      setPreferencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    listPreferencesRef.current = listPreferences;
  }, [listPreferences]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }
    window.localStorage.setItem(
      LIST_PREFERENCES_STORAGE_KEY,
      JSON.stringify(listPreferences)
    );
  }, [listPreferences, preferencesLoaded]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const controller = new AbortController();
    let ignore = false;

    async function loadWeekData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/calendar/week?date=${encodeURIComponent(currentDate.toISOString())}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const data = (await response.json()) as WeekCalendarPayload;

        if (ignore) {
          return;
        }

        setModules(
          applyListPreferencesToModules(data.modules, listPreferencesRef.current)
        );
        setEvents(data.events);
        setTodoLists(
          applyListPreferencesToTodoLists(
            data.todoLists,
            listPreferencesRef.current
          )
        );
        setTodos(data.todos);
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
  }, [currentDate, preferencesLoaded]);

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
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const handleRemoveTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddTodo = useCallback((text: string, listId: string) => {
    const newTodo: Todo = {
      id: `t${Date.now()}`,
      text,
      listId,
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const handleAddList = useCallback((name: string, color: string) => {
    const newList: TodoList = {
      id: `list-${Date.now()}`,
      name,
      color,
    };
    setTodoLists((prev) => [...prev, newList]);
  }, []);

  const handleDeleteList = useCallback((listId: string) => {
    setTodoLists((prev) => prev.filter((l) => l.id !== listId));
    setTodos((prev) => prev.filter((t) => t.listId !== listId));
  }, []);

  const handleRenameList = useCallback((listId: string, name: string) => {
    const targetList = todoLists.find((list) => list.id === listId);
    if (targetList) {
      const preferenceKey = getPreferenceKeyFromList(targetList);
      setListPreferences((prev) => ({
        ...prev,
        [preferenceKey]: {
          ...prev[preferenceKey],
          name,
        },
      }));
      setModules((prev) =>
        prev.map((module) =>
          module.id === preferenceKey ? { ...module, name } : module
        )
      );
    }
    setTodoLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, name } : l))
    );
  }, [todoLists]);

  const handleRecolorList = useCallback((listId: string, color: string) => {
    const targetList = todoLists.find((list) => list.id === listId);
    if (targetList) {
      const preferenceKey = getPreferenceKeyFromList(targetList);
      setListPreferences((prev) => ({
        ...prev,
        [preferenceKey]: {
          ...prev[preferenceKey],
          color,
        },
      }));
      setModules((prev) =>
        prev.map((module) =>
          module.id === preferenceKey ? { ...module, color } : module
        )
      );
    }
    setTodoLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, color } : l))
    );
  }, [todoLists]);

  return (
    <div className="nook-calendar-shell">
      <div className="nook-calendar-frame">
        <WeekHeader
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
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
