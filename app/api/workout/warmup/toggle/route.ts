import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout/warmup/toggle
 * Toggle warmup item completion
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { sessionId, warmupChecklistId, completed } = data;

        // Verify session belongs to user
        const workoutSession = await prisma.workoutSession.findUnique({
            where: { id: sessionId },
        });

        if (!workoutSession || workoutSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Update warmup log
        const warmupLog = await prisma.warmupLog.updateMany({
            where: {
                workoutSessionId: sessionId,
                warmupChecklistId,
                userId: session.user.id,
            },
            data: {
                completed,
            },
        });

        return NextResponse.json({ success: true, warmupLog });

    } catch (error) {
        console.error("[API] Failed to toggle warmup:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
