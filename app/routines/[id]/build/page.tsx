import { RoutineBuilderClient } from "@/components/routines/RoutineBuilderClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Routine Builder Page - Server Component
 * 
 * Prefetches routine + exercises for instant hydration
 */
export default async function RoutineBuilderPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: routineId } = await params;

  // Fetch routine with exercises
  const routine = await prisma.workoutRoutine.findUnique({
    where: { id: routineId },
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

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Routine not found</p>
      </div>
    );
  }

  // Check access
  if (!routine.isSystem && routine.userId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">You don't have permission to edit this routine</p>
      </div>
    );
  }

  // System routines are read-only
  if (routine.isSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">System routines cannot be edited</p>
      </div>
    );
  }

  // Fetch all exercises for picker
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      trackingType: true,
      defaultSets: true,
      defaultReps: true,
      defaultDuration: true,
      tracksDistance: true,
      defaultDistance: true,
    },
  });

  return (
    <RoutineBuilderClient
      routineId={routineId}
      initialRoutine={routine}
      initialExercises={exercises}
    />
  );
}
