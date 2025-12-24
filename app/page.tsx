import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { auth } from "@/lib/auth";
import { getDailyLogKey } from "@/lib/date-utils";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Dashboard Page - Server Component
 * 
 * Pre-fetches data server-side for instant initial render
 * Client component hydrates with this data and manages updates
 */
export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  // Create defaults if needed
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: session.user.id,
        ...DEFAULTS,
      },
    });
  }

  // Get today's date with user's cutoff
  const today = getDailyLogKey(
    undefined,
    settings.dayCutoffHour ?? DEFAULTS.dayCutoffHour,
    settings.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute
  );

  // Fetch today's daily log
  const dailyLog = await prisma.dailyLog.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
    include: {
      DailyReview: true,
    },
  });

  // Pass initial data to client component
  return (
    <DashboardClient 
      initialDailyLog={dailyLog}
      initialSettings={settings}
    />
  );
}
