import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DELETE /api/workout/abandon
 * Abandon a workout session
 * - If warmup not completed: DELETE session completely
 * - If warmup completed: Mark as ABANDONED (preserve data)
 */
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await request.json();

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

        // If warmup not completed, delete completely (no workout data)
        // Otherwise mark as ABANDONED to preserve data for history
        if (!workoutSession.warmupCompleted) {
            await prisma.workoutSession.delete({
                where: { id: sessionId },
            });
            return NextResponse.json({ success: true, deleted: true });
        }

        // Warmup completed - mark as abandoned but keep data
        const abandoned = await prisma.workoutSession.update({
            where: { id: sessionId },
            data: {
                status: "ABANDONED",
                completedAt: new Date(),
            },
        });

        return NextResponse.json({ session: abandoned });
    } catch (error) {
        console.error("[API] Failed to abandon session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
