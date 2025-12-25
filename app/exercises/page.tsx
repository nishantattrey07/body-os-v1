import { ExercisesClient } from "@/components/exercises/ExercisesClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Exercise Library Page - Server Component
 * 
 * Prefetches exercises data for instant page load (no skeleton).
 * Passes initialData to ExercisesClient for React Query hydration.
 */
export default async function ExercisesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Prefetch first page of exercises (all categories, all types)
  const limit = 20;
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [
        { isSystem: true },
        { userId: session.user.id },
      ],
    },
    take: limit + 1,
    orderBy: [
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      category: true,
      trackingType: true,
      defaultSets: true,
      defaultReps: true,
      defaultDuration: true,
      description: true,
      isSystem: true,
    },
  });

  const hasMore = exercises.length > limit;
  const items = hasMore ? exercises.slice(0, limit) : exercises;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return (
    <ExercisesClient
      initialExercises={items}
      initialHasMore={hasMore}
      initialCursor={nextCursor}
    />
  );
}
