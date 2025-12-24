import { WorkoutClient } from "@/components/workout/WorkoutClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function WorkoutPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch initial routines (first page)
  const routines = await prisma.workoutRoutine.findMany({
    where: {
      OR: [
        { isSystem: true },
        { userId: session.user.id },
      ],
    },
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
    orderBy: [
      { isSystem: 'desc' }, // System routines first
      { name: 'asc' },
    ],
    take: 20,
  });

  return <WorkoutClient initialRoutines={routines} />;
}
