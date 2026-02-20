"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  isToday,
  isSameWeek,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent, Module } from "@/lib/calendar-data";
import {
  HOURS,
  getWeekDays,
} from "@/lib/calendar-data";

interface WeekGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  modules: Module[];
}

const springConfig = { type: "spring" as const, stiffness: 80, damping: 10 };
const HOUR_HEIGHT = 64;
const minHour = Math.min(...HOURS);
const maxHour = Math.max(...HOURS);

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

interface LayoutEvent extends CalendarEvent {
  overlapIndex: number;
  totalOverlaps: number;
}

function calculateOverlaps(events: CalendarEvent[]): LayoutEvent[] {
  const sorted = [...events].sort((a, b) => {
    const aTime = a.startHour * 60 + a.startMinute;
    const bTime = b.startHour * 60 + b.startMinute;
    if (aTime === bTime) {
      const aEnd = a.endHour * 60 + a.endMinute;
      const bEnd = b.endHour * 60 + b.endMinute;
      return bEnd - aEnd;
    }
    return aTime - bTime;
  });

  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];
  let currentGroupEnd = -1;

  for (const event of sorted) {
    const evStart = event.startHour * 60 + event.startMinute;
    const evEnd = event.endHour * 60 + event.endMinute;

    if (currentGroup.length === 0) {
      currentGroup.push(event);
      currentGroupEnd = evEnd;
    } else if (evStart < currentGroupEnd) {
      currentGroup.push(event);
      currentGroupEnd = Math.max(currentGroupEnd, evEnd);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [event];
      currentGroupEnd = evEnd;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const result: LayoutEvent[] = [];

  groups.forEach((group) => {
    const groupColumns: CalendarEvent[][] = [];
    group.forEach((event) => {
      let placed = false;
      const evStart = event.startHour * 60 + event.startMinute;
      for (let i = 0; i < groupColumns.length; i++) {
        const col = groupColumns[i];
        const lastEv = col[col.length - 1];
        const lastEvEnd = lastEv.endHour * 60 + lastEv.endMinute;
        if (lastEvEnd <= evStart) {
          col.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groupColumns.push([event]);
      }
    });

    const totalCols = groupColumns.length;
    groupColumns.forEach((col, colIndex) => {
      col.forEach((event) => {
        result.push({
          ...event,
          overlapIndex: colIndex,
          totalOverlaps: totalCols,
        });
      });
    });
  });

  return result;
}

function EventBlock({ event, color }: { event: LayoutEvent; color: string }) {
  const top =
    (event.startHour - minHour) * HOUR_HEIGHT +
    (event.startMinute / 60) * HOUR_HEIGHT;
  const duration =
    event.endHour - event.startHour + (event.endMinute - event.startMinute) / 60;
  const height = duration * HOUR_HEIGHT;

  const widthPercent = 100 / event.totalOverlaps;
  const leftPercent = event.overlapIndex * widthPercent;

  const left = `calc(${leftPercent}% + 4px)`;
  const width = `calc(${widthPercent}% - 8px)`;

  const startTimeStr = `${event.startHour % 12 || 12}:${event.startMinute.toString().padStart(2, "0")}${event.startHour < 12 ? "a" : "p"}`;
  const endTimeStr = `${event.endHour % 12 || 12}:${event.endMinute.toString().padStart(2, "0")}${event.endHour < 12 ? "a" : "p"}`;

  return (
    <motion.div
      className="absolute cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1.5"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left,
        width,
        backgroundColor: `${color}1c`,
        borderColor: `${color}48`,
        borderLeft: `3px solid ${color}`,
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        y: -1,
        boxShadow: `0 8px 18px ${color}22`,
      }}
      transition={springConfig}
    >
      <p className="truncate text-[13px] font-semibold leading-tight text-[var(--foreground)]">
        {event.title}
      </p>
      <p
        className="mt-0.5 truncate text-[11px] font-medium"
        style={{ color: `${color}aa` }}
      >
        {startTimeStr} - {endTimeStr}
      </p>
    </motion.div>
  );
}

function CurrentTimeLine() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours < minHour || hours > maxHour) return null;

  const top = (hours - minHour) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="relative flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] -ml-[5px] shadow-lg shadow-[var(--primary)]/30" />
        <div className="flex-1 h-[2px] bg-[var(--primary)] shadow-sm shadow-[var(--primary)]/20" />
      </div>
    </div>
  );
}

export function WeekGrid({ currentDate, events, modules }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const moduleColors = useMemo(() => {
    return new Map(modules.map((module) => [module.id, module.color]));
  }, [modules]);

  const isCurrentWeek = isSameWeek(currentDate, new Date(), {
    weekStartsOn: 1,
  });

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const targetHour = isCurrentWeek ? Math.max(now.getHours() - 2, minHour) : minHour;
      scrollRef.current.scrollTo({ top: (targetHour - minHour) * HOUR_HEIGHT, behavior: "smooth" });
    }
  }, [currentDate, isCurrentWeek]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Scrollable time grid holding its own sticky header */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto calendar-scroll relative">
        {/* Day headers */}
        <div className="sticky top-0 z-30 flex shrink-0 border-b border-[var(--border)]/40 bg-[var(--card)]/80 backdrop-blur-md">
          <div className="w-16 flex-shrink-0" />
          {days.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className="flex-1 border-l border-[var(--border)]/40 py-3 text-center"
              >
                <div
                  className={`text-[11px] font-medium tracking-wide ${today
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                    }`}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-xl font-medium mt-0.5 ${today ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                    }`}
                >
                  {today ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                      {format(day, "d")}
                    </span>
                  ) : (
                    format(day, "d")
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springConfig}
            className="flex relative"
            style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
          >
            {/* Time labels column */}
            <div className="w-16 flex-shrink-0 relative bg-[var(--background)]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-3"
                  style={{
                    top: `${(hour - minHour) * HOUR_HEIGHT}px`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <span className="text-[11px] font-medium text-[var(--muted-foreground)]/70">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => {
              const today = isToday(day);
              const dayEvents = events.filter(
                (e) => e.dayOffset === dayIndex
              );
              const layoutEvents = calculateOverlaps(dayEvents);

              return (
                <div
                  key={dayIndex}
                  className="relative flex-1 border-l border-[var(--border)]/40"
                  style={{
                    backgroundColor: today
                      ? "var(--today-highlight)"
                      : undefined,
                  }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-[var(--border)]/40"
                      style={{
                        top: `${(hour - minHour) * HOUR_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {/* Events */}
                  {layoutEvents.map((event) => (
                    <EventBlock
                      key={event.id}
                      event={event}
                      color={moduleColors.get(event.moduleId) ?? "#86a37a"}
                    />
                  ))}

                  {/* Current time line */}
                  {today && isCurrentWeek && <CurrentTimeLine />}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

