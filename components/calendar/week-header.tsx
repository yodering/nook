"use client";

import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { getWeekLabel } from "@/lib/calendar-data";

interface WeekHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]";

export function WeekHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  sidebarOpen,
  onToggleSidebar,
}: WeekHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className={iconButtonClass}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--secondary)]/70 px-1 py-1">
          <button onClick={onPrev} className={iconButtonClass} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} className={iconButtonClass} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] sm:block">
            nook calendar
          </p>
          <h1 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {getWeekLabel(currentDate)}
          </h1>
        </div>
      </div>

      <button
        onClick={onToday}
        className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--secondary-foreground)] transition-colors hover:bg-[var(--muted)]"
      >
        today
      </button>
    </header>
  );
}
