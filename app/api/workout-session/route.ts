import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workout-session
 * Create a new workout session
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        const now = new Date();

        // Create workout session
        const workoutSession = await prisma.workoutSession.create({
            data: {
                userId: session.user.id,
                routineId,
                date: now,
                dayOfWeek: now.getDay(),
                weekOfYear: getWeekOfYear(now),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                preWorkoutEnergy,
                stressLevel,
                soreness,
                fastedWorkout,
                caffeineIntake,
                status: 'IN_PROGRESS',
                // Create session exercises
                SessionExercise: {
                    create: routine.RoutineExercise.map((re, index) => ({
                        order: index,
                        exerciseId: re.exerciseId,
                        targetSets: re.sets,
                        targetReps: re.reps,
                        targetDuration: re.duration,
                        targetWeight: re.weight,
                        targetDistance: re.distance, // Already in meters
                        restSeconds: re.restSeconds,
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
        const warmupLogs = await prisma.warmupLog.createMany({
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

// Helper: Get ISO week number
function getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
