import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/exercises
 * 
 * Fetches all exercises for the exercise picker
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const exercises = await prisma.exercise.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
                category: true,
                trackingType: true,
                defaultSets: true,
                defaultReps: true,
                defaultDuration: true,
            },
        });

        return NextResponse.json(exercises);
    } catch (error) {
        console.error("[GET /api/exercises] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch exercises" },
            { status: 500 }
        );
    }
}
