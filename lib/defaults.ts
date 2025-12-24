import { prisma } from "@/lib/prisma";

/**
 * Default values - single source of truth
 */
export const DEFAULTS = {
    dayCutoffHour: 5,
    dayCutoffMinute: 30,
    proteinTarget: 140,
    carbsTarget: 200,
    fatsTarget: 60,
    caloriesTarget: 2000,
    waterTarget: 4000,
} as const;

/**
 * Get day cutoff settings for a user (for internal use in server actions)
 * Returns defaults if user has no settings configured
 */
export async function getUserCutoff(userId: string): Promise<{ hour: number; minute: number }> {
    try {
        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { dayCutoffHour: true, dayCutoffMinute: true },
        });

        return {
            hour: settings?.dayCutoffHour ?? DEFAULTS.dayCutoffHour,
            minute: settings?.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute,
        };
    } catch (error) {
        // Fallback to defaults on any error
        console.warn("Failed to fetch user cutoff, using defaults:", error);
        return {
            hour: DEFAULTS.dayCutoffHour,
            minute: DEFAULTS.dayCutoffMinute,
        };
    }
}
