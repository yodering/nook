import {
  differenceInCalendarDays,
  endOfWeek,
  parseISO,
  startOfWeek,
} from "date-fns";
import {
  MODULE_COLORS,
  type CalendarEvent,
  type Module,
  type Todo,
  type TodoList,
  type WeekCalendarPayload,
} from "@/lib/calendar-data";

const GOOGLE_CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

interface GoogleCalendarListItem {
  id?: string;
  summary?: string;
  backgroundColor?: string;
  hidden?: boolean;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
  nextPageToken?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  status?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
  description?: string;
  location?: string;
}

interface GoogleEventsResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
}

export interface CalendarOverrideInput {
  calendarId: string;
  displayName: string | null;
  color: string | null;
  sortOrder: number;
  hidden: boolean;
  pinned: boolean;
}

async function googleFetch<T>(accessToken: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

interface CreateGoogleEventInput {
  accessToken: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  timeZone: string;
  colorId?: string;
  recurrence?: string[];
  description?: string;
  location?: string;
}

interface CreatedGoogleEvent {
  id?: string;
  summary?: string;
  start?: {
    dateTime?: string;
  };
  end?: {
    dateTime?: string;
  };
}

export async function createGoogleCalendarEvent(
  input: CreateGoogleEventInput
): Promise<CreatedGoogleEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(input.calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        summary: input.title,
        start: {
          dateTime: input.start,
          timeZone: input.timeZone,
        },
        end: {
          dateTime: input.end,
          timeZone: input.timeZone,
        },
        colorId: input.colorId,
        recurrence: input.recurrence,
        description: input.description,
        location: input.location,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${text}`);
  }

  return (await response.json()) as CreatedGoogleEvent;
}

interface UpdateGoogleEventInput {
  accessToken: string;
  calendarId: string;
  eventId: string;
  title: string;
  start: string;
  end: string;
  timeZone: string;
  colorId?: string;
  recurrence?: string[] | null;
  description?: string;
  location?: string;
}

export async function updateGoogleCalendarEvent(
  input: UpdateGoogleEventInput
): Promise<CreatedGoogleEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        summary: input.title,
        start: {
          dateTime: input.start,
          timeZone: input.timeZone,
        },
        end: {
          dateTime: input.end,
          timeZone: input.timeZone,
        },
        colorId: input.colorId,
        recurrence: input.recurrence,
        description: input.description,
        location: input.location,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${text}`);
  }

  return (await response.json()) as CreatedGoogleEvent;
}

export async function deleteGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${text}`);
  }
}

export async function fetchCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
  const calendars: GoogleCalendarListItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      maxResults: "250",
      showHidden: "false",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await googleFetch<GoogleCalendarListResponse>(
      accessToken,
      `${GOOGLE_CALENDAR_BASE_URL}/users/me/calendarList?${params.toString()}`
    );

    calendars.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return calendars.filter((calendar) => Boolean(calendar.id) && !calendar.hidden);
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
      maxResults: "2500",
      timeMin,
      timeMax,
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await googleFetch<GoogleEventsResponse>(
      accessToken,
      `${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );

    events.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return events;
}

function normalizeModules(
  calendars: GoogleCalendarListItem[],
  overrides: CalendarOverrideInput[]
): Module[] {
  const overrideMap = new Map(
    overrides.map((override) => [override.calendarId, override])
  );

  const colorIndexForId = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % MODULE_COLORS.length;
  };

  return calendars
    .filter((calendar) => {
      if (!calendar.id) return false;
      return !overrideMap.get(calendar.id)?.hidden;
    })
    .map((calendar, index) => {
      const override = calendar.id ? overrideMap.get(calendar.id) : undefined;
      return {
        id: calendar.id!,
        name: override?.displayName?.trim() || calendar.summary?.trim() || "untitled",
        color:
          override?.color ||
          calendar.backgroundColor ||
          MODULE_COLORS[
          calendar.id ? colorIndexForId(calendar.id) : index % MODULE_COLORS.length
          ],
      };
    })
    .sort((a, b) => {
      const overrideA = overrideMap.get(a.id);
      const overrideB = overrideMap.get(b.id);

      if (overrideA?.pinned && !overrideB?.pinned) return -1;
      if (!overrideA?.pinned && overrideB?.pinned) return 1;

      const sortA = overrideA?.sortOrder ?? 0;
      const sortB = overrideB?.sortOrder ?? 0;
      if (sortA !== sortB) {
        return sortA - sortB;
      }

      return a.name.localeCompare(b.name);
    });
}

function toCalendarEvent(
  event: GoogleCalendarEvent,
  moduleId: string,
  weekStart: Date
): CalendarEvent | null {
  if (!event.id || !event.start?.dateTime || !event.end?.dateTime) {
    return null;
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const dayOffset = differenceInCalendarDays(start, weekStart);
  if (dayOffset < 0 || dayOffset > 6) {
    return null;
  }

  const sameDayEnd =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const effectiveEnd = sameDayEnd
    ? end
    : new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      23,
      59,
      0,
      0
    );

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const safeEndMinutes = Math.max(
    startMinutes + 30,
    effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes()
  );
  const boundedEndMinutes = Math.min(safeEndMinutes, 23 * 60 + 59);

  return {
    id: `${moduleId}:${event.id}`,
    title: event.summary?.trim() || "untitled event",
    moduleId,
    dayOffset,
    startHour: start.getHours(),
    startMinute: start.getMinutes(),
    endHour: Math.floor(boundedEndMinutes / 60),
    endMinute: boundedEndMinutes % 60,
    description: event.description,
    location: event.location,
  };
}

function toTodo(
  event: GoogleCalendarEvent,
  moduleId: string,
  weekStart: Date
): Todo | null {
  if (!event.id || !event.start?.date) {
    return null;
  }

  const start = parseISO(event.start.date);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const dayOffset = differenceInCalendarDays(start, weekStart);
  if (dayOffset < 0 || dayOffset > 6) {
    return null;
  }

  return {
    id: `todo-${moduleId}-${event.id}`,
    text: event.summary?.trim() || "untitled task",
    listId: `list-${moduleId}`,
    completed: false,
    source: "google",
  };
}

export async function getWeekCalendarPayload(
  accessToken: string,
  anchorDate: Date,
  overrides: CalendarOverrideInput[] = []
): Promise<WeekCalendarPayload> {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const timeMin = weekStart.toISOString();
  const timeMax = weekEnd.toISOString();

  const rawCalendars = await fetchCalendars(accessToken);
  const modules = normalizeModules(rawCalendars, overrides);
  const todoLists: TodoList[] = modules.map((module) => ({
    id: `list-${module.id}`,
    name: module.name,
    color: module.color,
    moduleId: module.id,
  }));

  const calendarEvents = await Promise.all(
    modules.map(async (module) => {
      const events = await fetchEventsForCalendar(
        accessToken,
        module.id,
        timeMin,
        timeMax
      );
      return { moduleId: module.id, events };
    })
  );

  const events: CalendarEvent[] = [];
  const todos: Todo[] = [];

  for (const calendar of calendarEvents) {
    for (const event of calendar.events) {
      if (event.status === "cancelled") {
        continue;
      }

      const timedEvent = toCalendarEvent(event, calendar.moduleId, weekStart);
      if (timedEvent) {
        events.push(timedEvent);
        continue;
      }

      const todo = toTodo(event, calendar.moduleId, weekStart);
      if (todo) {
        todos.push(todo);
      }
    }
  }

  events.sort((a, b) => {
    if (a.dayOffset !== b.dayOffset) {
      return a.dayOffset - b.dayOffset;
    }
    if (a.startHour !== b.startHour) {
      return a.startHour - b.startHour;
    }
    return a.startMinute - b.startMinute;
  });

  return {
    modules,
    events,
    todoLists,
    todos,
  };
}
