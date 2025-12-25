import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/exercises/create
 * 
 * Creates a new user exercise
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            category,
            trackingType,
            defaultSets,
            defaultReps,
            defaultDuration,
            description,
        } = body;

        // Validation
        if (!name || !category || !trackingType || !defaultSets) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check for duplicate name (user's exercises only)
        const existing = await prisma.exercise.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive",
                },
                userId: session.user.id,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "An exercise with this name already exists" },
                { status: 409 }
            );
        }

        // Create exercise
        const exercise = await prisma.exercise.create({
            data: {
                name,
                category,
                trackingType,
                defaultSets,
                defaultReps: trackingType === "reps" ? defaultReps : null,
                defaultDuration: trackingType === "seconds" ? defaultDuration : null,
                description: description || null,
                isSystem: false,
                userId: session.user.id,
            },
        });

        return NextResponse.json(exercise);
    } catch (error) {
        console.error("[POST /api/exercises/create] Error:", error);
        return NextResponse.json(
            { error: "Failed to create exercise" },
            { status: 500 }
        );
    }
}
