import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/routines/create
 * 
 * Creates a new workout routine
 * Body: { name: string, description?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description } = body;

        // Validation
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Routine name is required" },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const existing = await prisma.workoutRoutine.findUnique({
            where: {
                name_userId: {
                    name: name.trim(),
                    userId: session.user.id,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "A routine with this name already exists" },
                { status: 409 }
            );
        }

        // Create routine
        const routine = await prisma.workoutRoutine.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                userId: session.user.id,
                isSystem: false,
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

        return NextResponse.json(routine, { status: 201 });
    } catch (error) {
        console.error("[POST /api/routines/create] Error:", error);
        return NextResponse.json(
            { error: "Failed to create routine" },
            { status: 500 }
        );
    }
}
