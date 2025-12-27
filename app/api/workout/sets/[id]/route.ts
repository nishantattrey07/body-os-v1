import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMeters } from "@/lib/utils/distance";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/workout/sets/[id]
 * 
 * Edit a previously logged set
 * 
 * Rules:
 * - Can only edit sets from IN_PROGRESS sessions
 * - Must own the session
 * - Cannot edit setNumber or sessionExerciseId
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const setId = (await params).id;
        const updates = await request.json();

        // 1. Fetch the set to verify ownership and session status
        const existingSet = await prisma.setLog.findUnique({
            where: { id: setId },
            include: {
                SessionExercise: {
                    include: {
                        WorkoutSession: true,
                    },
                },
            },
        });

        if (!existingSet) {
            return NextResponse.json({ error: "Set not found" }, { status: 404 });
        }

        // 2. Verify user owns this session
        if (existingSet.SessionExercise.WorkoutSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 3. Verify session is still IN_PROGRESS (cannot edit completed workouts)
        if (existingSet.SessionExercise.WorkoutSession.status !== "IN_PROGRESS") {
            return NextResponse.json(
                { error: "Cannot edit completed or abandoned workout" },
                { status: 400 }
            );
        }

        // 4. Prepare update data (only allow specific fields)
        const {
            actualReps,
            actualWeight,
            actualSeconds,
            actualDistance,
            distanceUnit,
            rpe,
            painLevel,
            painLocation,
            formNotes,
            isFailure,
            aggravatedBlockerId,
        } = updates;

        // Convert distance if provided
        const updatedDistance =
            actualDistance !== undefined && distanceUnit
                ? toMeters(actualDistance, distanceUnit)
                : actualDistance;

        // Build update object (only include provided fields)
        const updateData: any = {};
        if (actualReps !== undefined) updateData.actualReps = actualReps;
        if (actualWeight !== undefined) updateData.actualWeight = actualWeight;
        if (actualSeconds !== undefined) updateData.actualSeconds = actualSeconds;
        if (updatedDistance !== undefined) updateData.actualDistance = updatedDistance;
        if (rpe !== undefined) updateData.rpe = rpe;
        if (painLevel !== undefined) updateData.painLevel = painLevel;
        if (painLocation !== undefined) updateData.painLocation = painLocation;
        if (formNotes !== undefined) updateData.formNotes = formNotes;
        if (isFailure !== undefined) updateData.isFailure = isFailure;
        if (aggravatedBlockerId !== undefined) updateData.aggravatedBlockerId = aggravatedBlockerId;

        // 5. Update the set
        const updatedSet = await prisma.setLog.update({
            where: { id: setId },
            data: updateData,
        });

        // 6. Update session last activity
        await prisma.workoutSession.update({
            where: { id: existingSet.SessionExercise.WorkoutSession.id },
            data: { lastActivityAt: new Date() },
        });

        return NextResponse.json({ setLog: updatedSet });
    } catch (error) {
        console.error("[API] Failed to update set:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
