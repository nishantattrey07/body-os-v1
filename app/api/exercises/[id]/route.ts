import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidDistanceUnit, toMeters } from "@/lib/utils/distance";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/exercises/[id]
 * 
 * Updates an existing exercise (user exercises only)
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

        const { id } = await params;
        const body = await request.json();
        const {
            name,
            category,
            trackingType,
            defaultSets,
            defaultReps,
            defaultDuration,
            tracksDistance,
            defaultDistance,
            defaultDistanceUnit,
            description,
        } = body;

        // Check exercise exists and user owns it
        const exercise = await prisma.exercise.findUnique({
            where: { id },
        });

        if (!exercise) {
            return NextResponse.json(
                { error: "Exercise not found" },
                { status: 404 }
            );
        }

        if (exercise.isSystem) {
            return NextResponse.json(
                { error: "Cannot edit system exercises" },
                { status: 403 }
            );
        }

        if (exercise.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to edit this exercise" },
                { status: 403 }
            );
        }

        // Check for duplicate name (excluding current exercise)
        if (name !== exercise.name) {
            const existing = await prisma.exercise.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: "insensitive",
                    },
                    userId: session.user.id,
                    id: {
                        not: id,
                    },
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: "An exercise with this name already exists" },
                    { status: 409 }
                );
            }
        }

        // Validate distance unit if provided
        if (tracksDistance && defaultDistance && defaultDistanceUnit) {
            if (!isValidDistanceUnit(defaultDistanceUnit)) {
                return NextResponse.json(
                    { error: "Invalid distance unit. Must be 'm', 'km', or 'miles'" },
                    { status: 400 }
                );
            }
        }

        // Update exercise
        const updated = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                category,
                trackingType,
                defaultSets,
                defaultReps: trackingType === "reps" ? defaultReps : null,
                defaultDuration: trackingType === "seconds" ? defaultDuration : null,
                tracksDistance: tracksDistance || false,
                // Convert to meters for storage
                defaultDistance: tracksDistance && defaultDistance && defaultDistanceUnit
                    ? toMeters(defaultDistance, defaultDistanceUnit)
                    : null,
                description: description || null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[PUT /api/exercises/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to update exercise" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/exercises/[id]
 * 
 * Deletes an exercise (user exercises only)
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

        const { id } = await params;

        // Check exercise exists and user owns it
        const exercise = await prisma.exercise.findUnique({
            where: { id },
        });

        if (!exercise) {
            return NextResponse.json(
                { error: "Exercise not found" },
                { status: 404 }
            );
        }

        if (exercise.isSystem) {
            return NextResponse.json(
                { error: "Cannot delete system exercises" },
                { status: 403 }
            );
        }

        if (exercise.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to delete this exercise" },
                { status: 403 }
            );
        }

        // Delete exercise (history is safe via snapshots!)
        await prisma.exercise.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/exercises/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete exercise" },
            { status: 500 }
        );
    }
}
