"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameWeek,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  currentDate: Date;
  onWeekSelect: (date: Date) => void;
}

export function MiniCalendar({ currentDate, onWeekSelect }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(currentDate);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-[var(--foreground)]">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-semibold tracking-[0.16em] text-[var(--muted-foreground)]"
          >
            {label}
          </div>
        ))}

        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const today = isToday(day);
          const inCurrentWeek = isSameWeek(day, currentDate, { weekStartsOn: 1 });

          return (
            <button
              key={day.toISOString()}
              onClick={() => onWeekSelect(day)}
              className={`relative rounded-md py-1 text-[11px] font-medium transition-colors ${
                inMonth ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]/45"
              } ${inCurrentWeek && inMonth ? "bg-[var(--secondary)]" : ""} hover:bg-[var(--muted)]`}
            >
              <span className={today ? "font-bold text-[var(--primary)]" : ""}>
                {format(day, "d")}
              </span>
              {today && (
                <span className="absolute inset-x-0 bottom-[3px] mx-auto h-1 w-1 rounded-full bg-[var(--primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
