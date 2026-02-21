import {
  addDays,
  nextDay,
  parse,
  setHours,
  setMinutes,
  startOfDay,
  type Day,
} from "date-fns";

const WEEKDAY_INDEX: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

type SmartScheduleResult = {
  text: string;
  dueAt: Date | null;
  scheduleToken: string | null;
};

function parseTimeSegment(segment: string, anchor: Date): Date | null {
  const normalized = segment.trim().toLowerCase();
  if (!normalized) {
    return anchor;
  }

  const parsed12h = parse(normalized, "h:mma", anchor);
  if (!Number.isNaN(parsed12h.getTime())) {
    return parsed12h;
  }

  const parsed12hNoMinutes = parse(normalized, "ha", anchor);
  if (!Number.isNaN(parsed12hNoMinutes.getTime())) {
    return parsed12hNoMinutes;
  }

  const parsed24h = parse(normalized, "H:mm", anchor);
  if (!Number.isNaN(parsed24h.getTime())) {
    return parsed24h;
  }

  return null;
}

function resolveMonthDay(token: string, now: Date): Date | null {
  const thisYear = now.getFullYear();
  const dateThisYear = parse(`${token} ${thisYear}`, "MMM d yyyy", now);
  if (Number.isNaN(dateThisYear.getTime())) {
    return null;
  }

  if (dateThisYear >= startOfDay(now)) {
    return dateThisYear;
  }

  const nextYear = thisYear + 1;
  const dateNextYear = parse(`${token} ${nextYear}`, "MMM d yyyy", now);
  if (Number.isNaN(dateNextYear.getTime())) {
    return null;
  }

  return dateNextYear;
}

function parseSmartToken(token: string, now: Date): Date | null {
  const normalized = token.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) {
    return null;
  }

  const [base, ...timeParts] = normalized.split(" at ");
  const timeSegment = timeParts.join(" at ").trim();

  let anchor: Date | null = null;

  if (base === "today") {
    anchor = startOfDay(now);
  } else if (base === "tomorrow") {
    anchor = startOfDay(addDays(now, 1));
  } else if (base.startsWith("next ")) {
    const weekday = base.replace("next ", "").trim();
    const weekdayIndex = WEEKDAY_INDEX[weekday];
    if (weekdayIndex !== undefined) {
      anchor = startOfDay(nextDay(now, weekdayIndex));
    }
  } else if (WEEKDAY_INDEX[base] !== undefined) {
    const weekdayIndex = WEEKDAY_INDEX[base];
    anchor = startOfDay(nextDay(addDays(now, -1), weekdayIndex));
  } else {
    anchor = resolveMonthDay(base, now);
  }

  if (!anchor) {
    return null;
  }

  if (!timeSegment) {
    return setMinutes(setHours(anchor, 9), 0);
  }

  return parseTimeSegment(timeSegment, anchor);
}

export function parseSmartSchedule(input: string, now = new Date()): SmartScheduleResult {
  const match = input.match(/(?:^|\s)@([a-zA-Z0-9:\s]+)$/);
  if (!match) {
    return {
      text: input.trim(),
      dueAt: null,
      scheduleToken: null,
    };
  }

  const token = match[1].trim();
  const cleanText = input.slice(0, match.index).trim();
  const dueAt = parseSmartToken(token, now);

  return {
    text: cleanText || input.trim(),
    dueAt,
    scheduleToken: dueAt ? token : null,
  };
}
