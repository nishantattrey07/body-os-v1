import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout/exercise/complete
 * Mark a session exercise as completed
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionExerciseId } = await request.json();

        // Get session exercise
        const sessionExercise = await prisma.sessionExercise.findUnique({
            where: { id: sessionExerciseId },
        });

        if (!sessionExercise) {
            return NextResponse.json(
                { error: "Exercise not found" },
                { status: 404 }
            );
        }

        // Verify session belongs to user
        const workoutSession = await prisma.workoutSession.findUnique({
            where: { id: sessionExercise.sessionId },
        });

        if (!workoutSession || workoutSession.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // Mark exercise as completed
        const updated = await prisma.sessionExercise.update({
            where: { id: sessionExerciseId },
            data: { completedAt: new Date() },
        });

        return NextResponse.json({ success: true, exercise: updated });
    } catch (error) {
        console.error("[API] Failed to complete exercise:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
