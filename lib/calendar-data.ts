import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";

export interface Module {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  moduleId: string;
  dayOffset: number; // 0 = Monday, 1 = Tuesday, etc.
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface TodoList {
  id: string;
  name: string;
  color: string;
  moduleId?: string; // optional link to a calendar module
}

export interface Todo {
  id: string;
  text: string;
  listId: string;
  completed: boolean;
}

export interface WeekCalendarPayload {
  modules: Module[];
  events: CalendarEvent[];
  todoLists: TodoList[];
  todos: Todo[];
}

export const MODULE_COLORS = [
  "#E8A0A0",
  "#A0C4BC",
  "#B8A0D4",
  "#A8C4A0",
  "#D4B896",
  "#A0B8D4",
];

export function getWeekDays(currentDate: Date): Date[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });
}

export function getWeekLabel(currentDate: Date): string {
  const days = getWeekDays(currentDate);
  const start = days[0];
  const end = days[6];
  if (format(start, "MMM") === format(end, "MMM")) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

export function navigateWeek(
  currentDate: Date,
  direction: "prev" | "next"
): Date {
  return direction === "next"
    ? addWeeks(currentDate, 1)
    : subWeeks(currentDate, 1);
}

export const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8am to 11pm

export { addDays, format, startOfWeek };
