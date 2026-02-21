"use client";

import { ChevronLeft, ChevronRight, Moon, PanelLeftClose, PanelLeft, Sun } from "lucide-react";
import { getWeekLabel } from "@/lib/calendar-data";

interface WeekHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function WeekHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  sidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
}: WeekHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)]/40 bg-[var(--card)] px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors bg-transparent border-none p-1"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </button>

        <h1 className="text-lg font-medium tracking-tight text-[var(--foreground)]">
          {getWeekLabel(currentDate)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors" aria-label="Previous week">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={onNext} className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors" aria-label="Next week">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
