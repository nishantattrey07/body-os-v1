import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout/sets
 * Log a set for an exercise
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const {
            sessionExerciseId,
            setNumber,
            actualReps,
            actualSeconds,
            weight,
            weightUnit = "kg",
            rpe,
            painLevel,
            painLocation,
            restTaken,
            isWarmupSet = false,
            isDropSet = false,
            isFailure = false,
            formNotes,
            aggravatedBlockerId,
        } = data;

        // Verify session exercise belongs to user's session
        const sessionExercise = await prisma.sessionExercise.findUnique({
            where: { id: sessionExerciseId },
            include: {
                WorkoutSession: true,
            },
        });

        if (
            !sessionExercise ||
            sessionExercise.WorkoutSession.userId !== session.user.id
        ) {
            return NextResponse.json(
                { error: "Session exercise not found" },
                { status: 404 }
            );
        }

        // Create set log
        const setLog = await prisma.setLog.create({
            data: {
                sessionExerciseId,
                setNumber,
                actualReps,
                actualSeconds,
                weight,
                weightUnit,
                rpe,
                painLevel,
                painLocation,
                restTaken,
                isWarmupSet,
                isDropSet,
                isFailure,
                formNotes,
                aggravatedBlockerId,
                targetReps: sessionExercise.targetReps,
                targetDuration: sessionExercise.targetDuration,
            },
        });

        // Update session exercise start time if first set
        if (setNumber === 1 && !sessionExercise.startedAt) {
            await prisma.sessionExercise.update({
                where: { id: sessionExerciseId },
                data: { startedAt: new Date() },
            });
        }

        // Update session last activity
        await prisma.workoutSession.update({
            where: { id: sessionExercise.WorkoutSession.id },
            data: { lastActivityAt: new Date() },
        });

        return NextResponse.json({ setLog });
    } catch (error) {
        console.error("[API] Failed to log set:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
