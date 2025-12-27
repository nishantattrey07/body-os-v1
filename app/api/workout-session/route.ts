import { auth } from "@/lib/auth";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { getClientTimezone, getDateMetadataForTimezone } from "@/lib/server/timezone";
import { NextResponse } from "next/server";

/**
 * POST /api/workout-session
 * Create a new workout session
 * Uses client's timezone for date metadata (date, dayOfWeek, month, year)
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get client timezone from header
        const timezone = getClientTimezone(request);

        const data = await request.json();
        const {
            routineId,
            preWorkoutEnergy,
            stressLevel,
            soreness,
            fastedWorkout,
            caffeineIntake,
        } = data;

        // Get routine with exercises
        const routine = await prisma.workoutRoutine.findUnique({
            where: { id: routineId },
            include: {
                RoutineExercise: {
                    include: {
                        Exercise: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        if (!routine) {
            return NextResponse.json({ error: "Routine not found" }, { status: 404 });
        }

        // Get user settings for day cutoff
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { dayCutoffHour: true, dayCutoffMinute: true },
        });

        const cutoffHour = settings?.dayCutoffHour ?? DEFAULTS.dayCutoffHour;
        const cutoffMinute = settings?.dayCutoffMinute ?? DEFAULTS.dayCutoffMinute;

        // Get date metadata using CLIENT's timezone and cutoff
        const dateMetadata = getDateMetadataForTimezone(timezone, cutoffHour, cutoffMinute);

        // Create workout session
        const workoutSession = await prisma.workoutSession.create({
            data: {
                userId: session.user.id,
                routineId,
                // Use timezone-aware date metadata
                date: dateMetadata.date,
                dayOfWeek: dateMetadata.dayOfWeek,
                weekOfYear: dateMetadata.weekOfYear,
                month: dateMetadata.month,
                year: dateMetadata.year,
                // startedAt stays as UTC (exact moment)
                preWorkoutEnergy,
                stressLevel,
                soreness,
                fastedWorkout,
                caffeineIntake,
                status: 'IN_PROGRESS',
                // Create session exercises with SNAPSHOTS
                SessionExercise: {
                    create: routine.RoutineExercise.map((re, index) => ({
                        order: index,

                        // === SNAPSHOT FIELDS (frozen at workout time) ===
                        exerciseName: re.Exercise.name,
                        exerciseCategory: re.Exercise.category,
                        exerciseEquipment: re.Exercise.equipment,
                        trackingType: re.Exercise.trackingType,

                        // === NULLABLE REFERENCE ===
                        exerciseId: re.exerciseId,

                        // === TARGETS ===
                        targetSets: re.sets,
                        targetReps: re.reps,
                        targetDuration: re.duration,
                        targetWeight: re.weight,
                        targetDistance: re.distance, // Already in meters
                        restSeconds: re.restSeconds,
                        supersetId: re.supersetId, // Copy superset grouping
                    })),
                },
            },
            include: {
                SessionExercise: {
                    include: {
                        Exercise: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                WorkoutRoutine: true,
            },
        });

        // Get warmup checklist
        const warmupChecklist = await prisma.warmupChecklist.findMany({
            orderBy: { order: 'asc' },
        });

        // Create warmup logs for this session
        const userId = session.user.id;
        await prisma.warmupLog.createMany({
            data: warmupChecklist.map(item => ({
                userId,
                warmupChecklistId: item.id,
                workoutSessionId: workoutSession.id,
                completed: false,
            })),
        });

        return NextResponse.json({
            session: workoutSession,
            warmupData: {
                checklist: warmupChecklist,
                progress: await prisma.warmupLog.findMany({
                    where: { workoutSessionId: workoutSession.id },
                }),
            },
        });

    } catch (error) {
        console.error("[API] Failed to create workout session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/workout-session
 * Get active workout session for current user
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activeSession = await prisma.workoutSession.findFirst({
            where: {
                userId: session.user.id,
                status: 'IN_PROGRESS',
            },
            include: {
                SessionExercise: {
                    include: {
                        Exercise: true,
                        SetLog: {
                            select: {
                                setNumber: true,
                                actualReps: true,
                                actualSeconds: true,
                                actualWeight: true,
                            },
                            orderBy: {
                                setNumber: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                WorkoutRoutine: true,
            },
            orderBy: {
                startedAt: 'desc',
            },
        });

        if (!activeSession) {
            return NextResponse.json({ session: null });
        }

        return NextResponse.json({ session: activeSession });

    } catch (error) {
        console.error("[API] Failed to get active session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
