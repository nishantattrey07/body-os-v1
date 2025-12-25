import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/routines/[id]/exercises
 * 
 * Saves the complete exercise configuration for a routine.
 * Draft mode: ALL changes are saved in a single atomic transaction.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: routineId } = await params;
        const body = await request.json();
        const { exercises } = body;

        // Validate
        if (!Array.isArray(exercises)) {
            return NextResponse.json(
                { error: "Exercises must be an array" },
                { status: 400 }
            );
        }

        // Check routine exists and user owns it
        const routine = await prisma.workoutRoutine.findUnique({
            where: { id: routineId },
        });

        if (!routine) {
            return NextResponse.json(
                { error: "Routine not found" },
                { status: 404 }
            );
        }

        if (routine.isSystem) {
            return NextResponse.json(
                { error: "Cannot edit system routines" },
                { status: 403 }
            );
        }

        if (routine.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to edit this routine" },
                { status: 403 }
            );
        }

        // Atomic transaction: Delete all old exercises, create new ones
        await prisma.$transaction(async (tx) => {
            // Delete all existing exercises for this routine
            await tx.routineExercise.deleteMany({
                where: { routineId },
            });

            // Create new exercises
            if (exercises.length > 0) {
                await tx.routineExercise.createMany({
                    data: exercises.map((ex: any, idx: number) => ({
                        routineId,
                        exerciseId: ex.exerciseId,
                        order: idx + 1,
                        sets: ex.sets,
                        reps: ex.reps || null,
                        duration: ex.duration || null,
                        weight: ex.weight || null,
                        restSeconds: ex.restSeconds,
                    })),
                });
            }
        });

        // Fetch updated routine with exercises
        const updated = await prisma.workoutRoutine.findUnique({
            where: { id: routineId },
            include: {
                RoutineExercise: {
                    include: {
                        Exercise: true,
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[PUT /api/routines/[id]/exercises] Error:", error);
        return NextResponse.json(
            { error: "Failed to save exercises" },
            { status: 500 }
        );
    }
}
