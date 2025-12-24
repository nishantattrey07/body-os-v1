import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DELETE /api/workout/delete
 * Permanently delete a workout session
 * Use for: Incomplete warmup sessions
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

        // DELETE the session completely
        await prisma.workoutSession.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({ success: true, deleted: true });
    } catch (error) {
        console.error("[API] Failed to delete session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
