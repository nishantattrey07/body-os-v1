import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/exercises
 * 
 * Fetches exercises with search, filter, and pagination support
 * Query params:
 * - search: string (optional)
 * - category: string (optional, e.g., "Push", "Pull", "Core", "Legs")
 * - filter: "all" | "system" | "user" (optional, default: "all")
 * - limit: number (optional, default: 20)
 * - cursor: string (optional, for pagination)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || undefined;
        const category = searchParams.get("category") || undefined;
        const filter = (searchParams.get("filter") as "all" | "system" | "user") || "all";
        const limit = parseInt(searchParams.get("limit") || "20");
        const cursor = searchParams.get("cursor") || undefined;

        // Build where clause
        const where: any = {};

        // Search filter
        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive",
            };
        }

        // Category filter
        if (category) {
            where.category = category;
        }

        // Owner filter
        if (filter === "system") {
            where.isSystem = true;
        } else if (filter === "user") {
            where.isSystem = false;
            where.userId = session.user.id;
        } else {
            // "all" - show system + user's exercises
            where.OR = [
                { isSystem: true },
                { userId: session.user.id },
            ];
        }

        // Pagination with cursor
        const exercises = await prisma.exercise.findMany({
            where,
            take: limit + 1, // Fetch one extra to determine if there are more
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1, // Skip the cursor itself
            }),
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
                tracksDistance: true,
                defaultDistance: true,
                description: true,
                isSystem: true,
            },
        });

        // Check if there are more results
        const hasMore = exercises.length > limit;
        const items = hasMore ? exercises.slice(0, limit) : exercises;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return NextResponse.json({
            exercises: items,
            nextCursor,
            hasMore,
        });
    } catch (error) {
        console.error("[GET /api/exercises] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch exercises" },
            { status: 500 }
        );
    }
}
