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

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

function EventBlock({ event, color }: { event: CalendarEvent; color: string }) {
  const top =
    (event.startHour - 8) * HOUR_HEIGHT +
    (event.startMinute / 60) * HOUR_HEIGHT;
  const duration =
    event.endHour - event.startHour + (event.endMinute - event.startMinute) / 60;
  const height = duration * HOUR_HEIGHT;

  const startTimeStr = `${event.startHour % 12 || 12}:${event.startMinute.toString().padStart(2, "0")}${event.startHour < 12 ? "a" : "p"}`;
  const endTimeStr = `${event.endHour % 12 || 12}:${event.endMinute.toString().padStart(2, "0")}${event.endHour < 12 ? "a" : "p"}`;

  return (
    <motion.div
      className="absolute left-1.5 right-1.5 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1.5"
      style={{
        top: `${top}px`,
        height: `${height}px`,
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

  if (hours < 8 || hours > 23) return null;

  const top = (hours - 8) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;

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
      const targetHour = isCurrentWeek ? Math.max(now.getHours() - 2, 8) : 8;
      scrollRef.current.scrollTop = (targetHour - 8) * HOUR_HEIGHT;
    }
  }, [currentDate, isCurrentWeek]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--card)]/75">
        <div className="w-14 flex-shrink-0" />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className="flex-1 border-l border-[var(--border)] py-3 text-center"
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  today
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {format(day, "EEE")}
              </div>
              <div
                className={`text-lg font-semibold mt-0.5 ${
                  today ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                }`}
              >
                {today ? (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
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

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto calendar-scroll relative">
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
            <div className="w-14 flex-shrink-0 relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2"
                  style={{
                    top: `${(hour - 8) * HOUR_HEIGHT}px`,
                    transform: "translateY(-6px)",
                  }}
                >
                  <span className="text-[10px] font-normal text-[var(--muted-foreground)]">
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

              return (
                <div
                  key={dayIndex}
                  className="relative flex-1 border-l border-[var(--border)]"
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
                      className="absolute w-full border-t border-[var(--border)]/50"
                      style={{
                        top: `${(hour - 8) * HOUR_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map((event) => (
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
