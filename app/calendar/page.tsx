import { redirect } from "next/navigation";
import { CalendarApp } from "@/components/calendar/calendar-app";
import { auth } from "@/lib/auth";

export default async function CalendarPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <CalendarApp />;
}
