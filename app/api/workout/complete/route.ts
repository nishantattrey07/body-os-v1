import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout/complete
 * Complete a workout session with post-workout metrics
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const {
            sessionId,
            postWorkoutEnergy,
            pumpRating,
            focusRating,
            overallRating,
            notes,
        } = data;

        // Verify session belongs to user
        const workoutSession = await prisma.workoutSession.findUnique({
            where: { id: sessionId },
        });

        if (!workoutSession || workoutSession.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Calculate duration
        const duration = workoutSession.startedAt
            ? Math.floor(
                (Date.now() - workoutSession.startedAt.getTime()) / 1000 / 60
            )
            : 0;

        // Update session with completion data
        const updatedSession = await prisma.workoutSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                postWorkoutEnergy,
                pumpRating,
                focusRating,
                overallRating,
                notes,
            },
        });

        return NextResponse.json({ session: updatedSession });
    } catch (error) {
        console.error("[API] Failed to complete session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
