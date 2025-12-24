import { auth } from "@/lib/auth";
import { getDailyLogKey } from "@/lib/date-utils";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/daily-log
 * 
 * Fetches today's daily log with user's custom day cutoff
 * Supports If-Modified-Since for 304 caching
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user settings for day cutoff
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { dayCutoffHour: true, dayCutoffMinute: true },
        });

        const cutoffHour = settings?.dayCutoffHour ?? DEFAULTS.dayCutoffHour;
        const cutoffMinute = settings?.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute;

        // Get today's date key with custom cutoff
        const today = getDailyLogKey(undefined, cutoffHour, cutoffMinute);

        // Fetch daily log
        const log = await prisma.dailyLog.findUnique({
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

        // Check If-Modified-Since header for caching
        const ifModifiedSince = req.headers.get("if-modified-since");
        if (log && ifModifiedSince) {
            const clientTime = new Date(ifModifiedSince);
            const serverTime = new Date(log.date);

            if (serverTime <= clientTime) {
                // Client has latest data - return 304
                return new NextResponse(null, { status: 304 });
            }
        }

        // Return data with server timestamp
        const response = {
            ...log,
            serverTimestamp: new Date(log?.date || Date.now()).toISOString(),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[API] Failed to fetch daily log:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/daily-log
 * 
 * Create or update daily log (morning check-in)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { weight, sleepHours, sleepQuality, mood } = body;

        // Get user settings for day cutoff
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { dayCutoffHour: true, dayCutoffMinute: true },
        });

        const cutoffHour = settings?.dayCutoffHour ?? DEFAULTS.dayCutoffHour;
        const cutoffMinute = settings?.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute;

        const today = getDailyLogKey(undefined, cutoffHour, cutoffMinute);

        // Upsert daily log
        const log = await prisma.dailyLog.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: today,
                },
            },
            update: {
                weight,
                sleepHours,
                sleepQuality,
                mood,
            },
            create: {
                userId: session.user.id,
                date: today,
                weight,
                sleepHours,
                sleepQuality,
                mood,
            },
        });

        return NextResponse.json({
            ...log,
            serverTimestamp: new Date(log.date).toISOString(),
        });
    } catch (error) {
        console.error("[API] Failed to create/update daily log:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
