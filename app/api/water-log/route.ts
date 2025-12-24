import { auth } from "@/lib/auth";
import { getDailyLogKey } from "@/lib/date-utils";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/water-log
 * 
 * Log water intake with optimistic UI support
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        const today = getDailyLogKey(undefined, cutoffHour, cutoffMinute);

        // Create water log entry
        const waterLog = await prisma.waterLog.create({
            data: {
                userId: session.user.id,
                amount,
                timestamp: new Date(),
            },
        });

        // Update daily log total
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
