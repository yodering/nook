import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarApp } from "@/components/calendar/calendar-app";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "calendar",
};

export default async function CalendarPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <CalendarApp />;
}
