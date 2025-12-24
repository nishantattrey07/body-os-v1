import { auth } from "@/lib/auth";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/settings
 * 
 * Fetch user settings, create with defaults if doesn't exist
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
        });

        // Create default settings if user doesn't have any
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id,
                    ...DEFAULTS,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("[API] Failed to fetch settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/settings
 * 
 * Update user settings
 */
export async function POST(request: Request) {
    try {
        const requestStart = performance.now();
        console.log('📥 [API] Settings POST received at:', new Date().toISOString());

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        console.log('📝 [API] Updating settings for user:', session.user.id);

        const dbStart = performance.now();
        const settings = await prisma.userSettings.update({
            where: { userId: session.user.id },
            data: {
                proteinTarget: data.proteinTarget,
                carbsTarget: data.carbsTarget,
                fatsTarget: data.fatsTarget,
                caloriesTarget: data.caloriesTarget,
                waterTarget: data.waterTarget,
                dayCutoffHour: data.dayCutoffHour,
                dayCutoffMinute: data.dayCutoffMinute,
            },
        });
        const dbEnd = performance.now();

        const requestEnd = performance.now();
        console.log(`✅ [API] Database update took: ${Math.round(dbEnd - dbStart)}ms`);
        console.log(`✅ [API] Total request time: ${Math.round(requestEnd - requestStart)}ms`);

        return NextResponse.json(settings);
    } catch (error) {
        console.error("[API] Failed to update settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
