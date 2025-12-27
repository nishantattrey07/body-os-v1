import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/workout/exercise/note
 * 
 * Save a note for an exercise after completion
 * Used for quick feedback: form, feeling, improvements
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionExerciseId, note } = await req.json();

        if (!sessionExerciseId || typeof note !== 'string') {
            return NextResponse.json(
                { error: "sessionExerciseId and note are required" },
                { status: 400 }
            );
        }

        // Update the session exercise with the note
        const updated = await prisma.sessionExercise.update({
            where: { id: sessionExerciseId },
            data: {
                exerciseNote: note.trim() || null, // Empty string becomes null
                noteAddedAt: note.trim() ? new Date() : null
            }
        });

        return NextResponse.json({ success: true, exerciseNote: updated.exerciseNote });
    } catch (error) {
        console.error("[POST /api/workout/exercise/note] Error:", error);
        return NextResponse.json(
            { error: "Failed to save exercise note" },
            { status: 500 }
        );
    }
}
