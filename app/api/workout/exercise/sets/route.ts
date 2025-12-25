import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/workout/exercise/sets?sessionExerciseId=xxx
 * Fetch all logged sets for a specific exercise
 */
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionExerciseId = searchParams.get("sessionExerciseId");

        if (!sessionExerciseId) {
            return NextResponse.json(
                { error: "sessionExerciseId is required" },
                { status: 400 }
            );
        }

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

        // Fetch all sets for this exercise
        const sets = await prisma.setLog.findMany({
            where: { sessionExerciseId },
            orderBy: { setNumber: "asc" },
            select: {
                setNumber: true,
                actualReps: true,
                actualSeconds: true,
                actualWeight: true,
                rpe: true,
                completedAt: true,
            },
        });

        return NextResponse.json({
            sets,
            count: sets.length,
        });
    } catch (error) {
        console.error("[API] Failed to fetch sets:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
