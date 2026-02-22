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
  defaultEventDuration: number;
  onCreateEvent: (input: {
    calendarId: string;
    title: string;
    start: string;
    durationMinutes: number;
    recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
    colorId?: string;
    timeZone: string;
  }) => Promise<boolean>;
  onUpdateEvent: (input: {
    eventCompositeId: string;
    calendarId: string;
    eventId: string;
    title: string;
    start: string;
    durationMinutes: number;
    recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
    colorId?: string;
    timeZone: string;
  }) => Promise<boolean>;
  onDeleteEvent: (input: {
    eventCompositeId: string;
    calendarId: string;
    eventId: string;
  }) => Promise<boolean>;
}

const springConfig = { type: "spring" as const, stiffness: 80, damping: 10 };
const HOUR_HEIGHT = 64;
const minHour = Math.min(...HOURS);
const maxHour = Math.max(...HOURS);
const EVENT_COLOR_OPTIONS = [
  { id: "1", hex: "#a4bdfc" },
  { id: "2", hex: "#7ae7bf" },
  { id: "3", hex: "#dbadff" },
  { id: "4", hex: "#ff887c" },
  { id: "5", hex: "#fbd75b" },
  { id: "6", hex: "#ffb878" },
  { id: "7", hex: "#46d6db" },
  { id: "8", hex: "#e1e1e1" },
  { id: "9", hex: "#5484ed" },
  { id: "10", hex: "#51b749" },
  { id: "11", hex: "#dc2127" },
] as const;

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

function EventBlock({
  event,
  color,
  onClick,
}: {
  event: LayoutEvent;
  color: string;
  onClick?: () => void;
}) {
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
      onClick={onClick}
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

export function WeekGrid({
  currentDate,
  events,
  modules,
  defaultEventDuration,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<{
    dayIndex: number;
    hour: number;
    minute: number;
    calendarId: string;
    title: string;
    durationMinutes: number;
    recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
    colorId: string;
  } | null>(null);
  const [editingEvent, setEditingEvent] = useState<LayoutEvent | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    hour: number;
    minute: number;
    durationMinutes: number;
  } | null>(null);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
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

  function getStartIso(dayIndex: number, hour: number, minute: number): string {
    const baseDay = days[dayIndex];
    const start = new Date(baseDay);
    start.setHours(hour, minute, 0, 0);
    return start.toISOString();
  }

  function openCreateModal(dayIndex: number, clientY: number, top: number) {
    if (modules.length === 0) {
      return;
    }
    const relativeY = Math.max(0, clientY - top);
    const hourFloat = minHour + relativeY / HOUR_HEIGHT;
    const roundedMinutes = Math.round(hourFloat * 4) * 15;
    const hour = Math.floor(roundedMinutes / 60);
    const minute = roundedMinutes % 60;

    setDraft({
      dayIndex,
      hour: Math.max(minHour, Math.min(maxHour, hour)),
      minute,
      calendarId: modules[0].id,
      title: "",
      durationMinutes: defaultEventDuration || 60,
      recurrence: "none",
      colorId: "9",
    });
    setShowCreateModal(true);
  }

  async function submitDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setIsSubmitting(true);
    const success = await onCreateEvent({
      calendarId: draft.calendarId,
      title: draft.title,
      start: getStartIso(draft.dayIndex, draft.hour, draft.minute),
      durationMinutes: draft.durationMinutes,
      recurrence: draft.recurrence,
      colorId: draft.colorId || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
    setIsSubmitting(false);
    if (success) {
      setShowCreateModal(false);
      setDraft(null);
    }
  }

  function parseCompositeEventId(compositeId: string): { calendarId: string; eventId: string } | null {
    const separator = compositeId.lastIndexOf(":");
    if (separator <= 0 || separator >= compositeId.length - 1) {
      return null;
    }
    return {
      calendarId: compositeId.slice(0, separator),
      eventId: compositeId.slice(separator + 1),
    };
  }

  function openEditModal(event: LayoutEvent) {
    const duration =
      (event.endHour - event.startHour) * 60 + (event.endMinute - event.startMinute);
    setEditingEvent(event);
    setEditDraft({
      title: event.title,
      hour: event.startHour,
      minute: event.startMinute,
      durationMinutes: Math.max(30, duration),
    });
  }

  async function submitEditDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent || !editDraft) return;
    const parsed = parseCompositeEventId(editingEvent.id);
    if (!parsed) return;
    setIsEditingSubmitting(true);
    const start = new Date(days[editingEvent.dayOffset]);
    start.setHours(editDraft.hour, editDraft.minute, 0, 0);

    const success = await onUpdateEvent({
      eventCompositeId: editingEvent.id,
      calendarId: parsed.calendarId,
      eventId: parsed.eventId,
      title: editDraft.title,
      start: start.toISOString(),
      durationMinutes: editDraft.durationMinutes,
      recurrence: "none",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
    setIsEditingSubmitting(false);
    if (success) {
      setEditingEvent(null);
      setEditDraft(null);
    }
  }

  async function handleDeleteEditingEvent() {
    if (!editingEvent) return;
    const parsed = parseCompositeEventId(editingEvent.id);
    if (!parsed) return;
    setIsEditingSubmitting(true);
    const success = await onDeleteEvent({
      eventCompositeId: editingEvent.id,
      calendarId: parsed.calendarId,
      eventId: parsed.eventId,
    });
    setIsEditingSubmitting(false);
    if (success) {
      setEditingEvent(null);
      setEditDraft(null);
    }
  }

  return (
    <>
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
                  onDoubleClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    openCreateModal(dayIndex, event.clientY, rect.top);
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
                      onClick={() => openEditModal(event)}
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
      <AnimatePresence>
        {showCreateModal && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => {
              if (!isSubmitting) {
                setShowCreateModal(false);
                setDraft(null);
              }
            }}
          >
            <motion.form
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={springConfig}
              onSubmit={submitDraft}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-[var(--foreground)]">Create Event</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {format(days[draft.dayIndex], "EEE, MMM d")} at{" "}
                {`${draft.hour % 12 || 12}:${draft.minute.toString().padStart(2, "0")}${draft.hour < 12 ? "am" : "pm"}`}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Event title"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={draft.durationMinutes}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? { ...prev, durationMinutes: Number(e.target.value) }
                          : prev
                      )
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>

                  <select
                    value={draft.recurrence}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? {
                            ...prev,
                            recurrence: e.target.value as typeof draft.recurrence,
                          }
                          : prev
                      )
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <select
                  value={draft.calendarId}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, calendarId: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {EVENT_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) =>
                          prev ? { ...prev, colorId: color.id } : prev
                        )
                      }
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-105 ${draft.colorId === color.id
                          ? "border-[var(--foreground)]"
                          : "border-transparent"
                        }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Pick event color ${color.id}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setDraft(null);
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingEvent && editDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => {
              if (!isEditingSubmitting) {
                setEditingEvent(null);
                setEditDraft(null);
              }
            }}
          >
            <motion.form
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={springConfig}
              onSubmit={submitEditDraft}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-[var(--foreground)]">Edit Event</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {format(days[editingEvent.dayOffset], "EEE, MMM d")}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={editDraft.title}
                  onChange={(e) =>
                    setEditDraft((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={`${editDraft.hour.toString().padStart(2, "0")}:${editDraft.minute.toString().padStart(2, "0")}`}
                    onChange={(e) => {
                      const [hourRaw, minuteRaw] = e.target.value.split(":");
                      const hour = Number(hourRaw);
                      const minute = Number(minuteRaw);
                      if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
                        setEditDraft((prev) =>
                          prev ? { ...prev, hour, minute } : prev
                        );
                      }
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                  />

                  <select
                    value={editDraft.durationMinutes}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? { ...prev, durationMinutes: Number(e.target.value) }
                          : prev
                      )
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--ring)]"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteEditingEvent}
                  disabled={isEditingSubmitting}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)]/10 disabled:opacity-50"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      setEditDraft(null);
                    }}
                    disabled={isEditingSubmitting}
                    className="rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditingSubmitting}
                    className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
                  >
                    {isEditingSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
