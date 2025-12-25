import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/routines/[id]
 * 
 * Fetches a single routine with exercises
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: routineId } = await params;

        const routine = await prisma.workoutRoutine.findUnique({
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

        if (!routine) {
            return NextResponse.json(
                { error: "Routine not found" },
                { status: 404 }
            );
        }

        // Check access: must be system routine OR user's own routine
        if (!routine.isSystem && routine.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to view this routine" },
                { status: 403 }
            );
        }

        return NextResponse.json(routine);
    } catch (error) {
        console.error("[GET /api/routines/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch routine" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/routines/[id]
 * 
 * Updates routine metadata (name and description only)
 * Body: { name: string, description?: string }
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
        const { name, description } = body;

        // Validation
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Routine name is required" },
                { status: 400 }
            );
        }

        // Check if routine exists and user owns it
        const existing = await prisma.workoutRoutine.findUnique({
            where: { id: routineId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Routine not found" },
                { status: 404 }
            );
        }

        if (existing.isSystem) {
            return NextResponse.json(
                { error: "Cannot edit system routines" },
                { status: 403 }
            );
        }

        if (existing.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to edit this routine" },
                { status: 403 }
            );
        }

        // Check for duplicate name (excluding current routine)
        const duplicate = await prisma.workoutRoutine.findFirst({
            where: {
                name: name.trim(),
                userId: session.user.id,
                id: { not: routineId },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { error: "A routine with this name already exists" },
                { status: 409 }
            );
        }

        // Update routine
        const updated = await prisma.workoutRoutine.update({
            where: { id: routineId },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
            },
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
        console.error("[PUT /api/routines/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to update routine" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/routines/[id]
 * 
 * Deletes a routine (and cascades to RoutineExercise via Prisma schema)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: routineId } = await params;

        // Check if routine exists and user owns it
        const existing = await prisma.workoutRoutine.findUnique({
            where: { id: routineId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Routine not found" },
                { status: 404 }
            );
        }

        if (existing.isSystem) {
            return NextResponse.json(
                { error: "Cannot delete system routines" },
                { status: 403 }
            );
        }

        if (existing.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to delete this routine" },
                { status: 403 }
            );
        }

        // Delete routine (cascade delete RoutineExercise via schema)
        await prisma.workoutRoutine.delete({
            where: { id: routineId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/routines/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete routine" },
            { status: 500 }
        );
    }
}
