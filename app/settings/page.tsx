import { SettingsClient } from "@/components/settings/SettingsClient";
import { auth } from "@/lib/auth";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Settings Page - Server Component
 * 
 * Fetches initial settings and passes to client
 * Zero loading state! (instant hydration)
 */
export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch settings (create with defaults if doesn't exist)
  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: session.user.id,
        ...DEFAULTS,
      },
    });
  }

  return <SettingsClient initialSettings={settings} />;
}
