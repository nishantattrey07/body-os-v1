import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout/warmup/complete
 * Mark warmup as complete for session
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { sessionId } = data;

        // Verify session belongs to user
        const workoutSession = await prisma.workoutSession.findUnique({
            where: { id: sessionId },
        });

        if (!workoutSession || workoutSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Mark warmup complete
        const updated = await prisma.workoutSession.update({
            where: { id: sessionId },
            data: {
                warmupCompleted: true,
            },
        });

        return NextResponse.json({ success: true, session: updated });

    } catch (error) {
        console.error("[API] Failed to mark warmup complete:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
