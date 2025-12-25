import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/exercises/categories
 * 
 * Fetches all unique exercise categories (system + user)
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all unique categories from exercises
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { isSystem: true },
                    { userId: session.user.id },
                ],
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        });

        const categories = exercises.map(e => e.category).filter(Boolean).sort();

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("[GET /api/exercises/categories] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
