import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/workout-session/[id]
 * 
 * Delete a workout session and ALL related data:
 * - All SessionExercise records
 * - All SetLog records (via cascade)
 * - The WorkoutSession itself
 * 
 * This completely clears the history of a session.
 */
// export async function DELETE(
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionId = (await params).id;

        // 1. Verify session belongs to user
        const workoutSession = await prisma.workoutSession.findUnique({
            where: { id: sessionId },
        });

        if (!workoutSession) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        if (workoutSession.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // 2. Delete all SetLogs first (they reference SessionExercise)
        const deletedSets = await prisma.setLog.deleteMany({
            where: {
                SessionExercise: {
                    sessionId: sessionId,
                },
            },
        });

        // 3. Delete all SessionExercises
        const deletedExercises = await prisma.sessionExercise.deleteMany({
            where: {
                sessionId: sessionId,
            },
        });

        // 4. Delete the WorkoutSession itself
        await prisma.workoutSession.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({
            success: true,
            deleted: {
                sets: deletedSets.count,
                exercises: deletedExercises.count,
                session: 1,
            },
        });
    } catch (error) {
        console.error("[API] Failed to delete session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
