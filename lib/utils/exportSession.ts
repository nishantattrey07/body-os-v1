import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Formatted workout session data structure
 */
export interface FormattedSessionData {
    session: {
        id: string;
        date: Date;
        startedAt: Date;
        completedAt: Date | null;
        status: string;
        activeSeconds: number;
        routine: string | null;
        notes: string | null;
        ratings: {
            preWorkoutEnergy: number | null;
            postWorkoutEnergy: number | null;
            pumpRating: number | null;
            focusRating: number | null;
            overallRating: number | null;
        };
        stats: {
            totalExercises: number;
            totalSets: number;
            totalVolume: number; // sum of (weight × reps)
        };
    };
    exercises: Array<{
        order: number;
        exercise: {
            name: string;
            category: string;
            equipment: string | null;
        };
        targetSets: number;
        targetReps: number | null;
        targetWeight: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
        skipped: boolean;
        exerciseNote: string | null;     // NEW
        noteAddedAt: Date | null;        // NEW
        sets: Array<{
            setNumber: number;
            actualReps: number | null;
            actualWeight: number;
            weightUnit: string;
            actualSeconds: number | null;
            actualDistance: number | null;
            rpe: number | null;
            painLevel: number | null;
            painLocation: string | null;
            isWarmupSet: boolean;
            isDropSet: boolean;
            isFailure: boolean;
            formNotes: string | null;
            completedAt: Date;
        }>;
    }>;
}

/**
 * Fetch and format complete workout session data
 */
export async function getFormattedSessionData(sessionId: string): Promise<FormattedSessionData> {
    const session = await prisma.workoutSession.findUnique({
        where: { id: sessionId },
        include: {
            WorkoutRoutine: {
                select: { name: true }
            },
            SessionExercise: {
                include: {
                    Exercise: {
                        select: {
                            name: true,
                            category: true,
                            equipment: true
                        }
                    },
                    SetLog: {
                        orderBy: { setNumber: 'asc' }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Calculate total volume
    let totalVolume = 0;
    let totalSets = 0;

    session.SessionExercise.forEach(ex => {
        ex.SetLog.forEach(set => {
            totalSets++;
            if (set.actualReps && set.actualWeight) {
                totalVolume += set.actualReps * set.actualWeight;
            }
        });
    });

    // Format the data
    const formatted: FormattedSessionData = {
        session: {
            id: session.id,
            date: session.date,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            status: session.status,
            activeSeconds: session.activeSeconds,
            routine: session.WorkoutRoutine?.name || null,
            notes: session.notes,
            ratings: {
                preWorkoutEnergy: session.preWorkoutEnergy,
                postWorkoutEnergy: session.postWorkoutEnergy,
                pumpRating: session.pumpRating,
                focusRating: session.focusRating,
                overallRating: session.overallRating
            },
            stats: {
                totalExercises: session.SessionExercise.length,
                totalSets,
                totalVolume
            }
        },
        exercises: session.SessionExercise.map(sessionEx => ({
            order: sessionEx.order,
            exercise: {
                name: sessionEx.exerciseName,           // SNAPSHOT
                category: sessionEx.exerciseCategory,   // SNAPSHOT
                equipment: sessionEx.exerciseEquipment  // SNAPSHOT
            },
            targetSets: sessionEx.targetSets,
            targetReps: sessionEx.targetReps,
            targetWeight: sessionEx.targetWeight,
            startedAt: sessionEx.startedAt,
            completedAt: sessionEx.completedAt,
            skipped: sessionEx.skipped,
            exerciseNote: sessionEx.exerciseNote,       // NEW
            noteAddedAt: sessionEx.noteAddedAt,         // NEW
            sets: sessionEx.SetLog.map(set => ({
                setNumber: set.setNumber,
                actualReps: set.actualReps,
                actualWeight: set.actualWeight,
                weightUnit: set.weightUnit,
                actualSeconds: set.actualSeconds,
                actualDistance: set.actualDistance,
                rpe: set.rpe,
                painLevel: set.painLevel,
                painLocation: set.painLocation,
                isWarmupSet: set.isWarmupSet,
                isDropSet: set.isDropSet,
                isFailure: set.isFailure,
                formNotes: set.formNotes,
                completedAt: set.completedAt
            }))
        }))
    };

    return formatted;
}

/**
 * Export session data to JSON file
 */
export async function exportSessionToJson(
    sessionId: string,
    outputPath?: string
): Promise<string> {
    const data = await getFormattedSessionData(sessionId);

    // Default path: /exports/session-{id}.json
    const defaultPath = path.join(process.cwd(), 'exports', `session-${sessionId}.json`);
    const filePath = outputPath || defaultPath;

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write formatted JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Session data exported to: ${filePath}`);
    return filePath;
}

/**
 * Find session by date and export
 */
export async function exportSessionByDate(
    date: Date,
    userId: string,
    outputPath?: string
): Promise<string> {
    const session = await prisma.workoutSession.findFirst({
        where: {
            userId,
            date: {
                gte: new Date(date.setHours(0, 0, 0, 0)),
                lt: new Date(date.setHours(23, 59, 59, 999))
            }
        },
        orderBy: { startedAt: 'desc' }
    });

    if (!session) {
        throw new Error(`No session found for date ${date.toISOString()}`);
    }

    return exportSessionToJson(session.id, outputPath);
}
