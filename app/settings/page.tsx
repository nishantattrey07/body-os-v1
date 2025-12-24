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
  const pageStart = performance.now();
  console.log('🚀 [Settings Page] Server component started at:', new Date().toISOString());
  
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch settings (create with defaults if doesn't exist)
  const dbStart = performance.now();
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
  const dbEnd = performance.now();
  
  const pageEnd = performance.now();
  console.log(`✅ [Settings Page] Database fetch took: ${Math.round(dbEnd - dbStart)}ms`);
  console.log(`✅ [Settings Page] Server render total: ${Math.round(pageEnd - pageStart)}ms`);

  return <SettingsClient initialSettings={settings} />;
}
