import { auth } from "@/lib/auth";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { getClientTimezone, getDayKeyForTimezone } from "@/lib/server/timezone";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/water-log
 * 
 * Log water intake with optimistic UI support
 * Uses client's timezone from X-Timezone header for day boundary
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get client timezone from header
        const timezone = getClientTimezone(req);

        const body = await req.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Get user settings for day cutoff
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { dayCutoffHour: true, dayCutoffMinute: true },
        });

        const cutoffHour = settings?.dayCutoffHour ?? DEFAULTS.dayCutoffHour;
        const cutoffMinute = settings?.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute;

        // Get today using CLIENT's timezone and cutoff
        const today = getDayKeyForTimezone(timezone, cutoffHour, cutoffMinute);

        // Create water log entry (timestamp stays as UTC - exact moment)
        const waterLog = await prisma.waterLog.create({
            data: {
                userId: session.user.id,
                amount,
                timestamp: new Date(), // UTC - exact moment of logging
            },
        });

        // Update daily log total (using client's day)
        const dailyLog = await prisma.dailyLog.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: today,
                },
            },
            update: {
                waterTotal: {
                    increment: amount,
                },
            },
            create: {
                userId: session.user.id,
                date: today,
                waterTotal: amount,
            },
        });

        return NextResponse.json({
            waterLog,
            dailyLog,
            serverTimestamp: new Date(dailyLog.date).toISOString(),
        });
    } catch (error) {
        console.error("[API] Failed to log water:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
