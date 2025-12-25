import { RoutinesClient } from "@/components/routines/RoutinesClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Routines Page - Server Component
 * 
 * Pre-fetches initial routines on the server for instant hydration.
 * No skeleton needed - data arrives with the page.
 * 
 * Follows same pattern as /workout page for consistency.
 */
export default async function RoutinesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch first 20 routines (system + user)
  const routines = await prisma.workoutRoutine.findMany({
    where: {
      OR: [
        { isSystem: true },
        { userId: session.user.id, isSystem: false },
      ],
    },
    include: {
      RoutineExercise: {
        include: {
          Exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              trackingType: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: [
      { isSystem: "desc" }, // System routines first
      { name: "asc" },
    ],
    take: 20,
  });

  return <RoutinesClient initialRoutines={routines} />;
}
