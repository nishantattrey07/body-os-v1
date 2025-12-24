import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const includeSystem = searchParams.get("includeSystem") !== "false";
    const includeUser = searchParams.get("includeUser") !== "false";
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor") || undefined;

    // Build where clause
    const where: any = {
        OR: [],
    };

    if (includeSystem) {
        where.OR.push({ isSystem: true });
    }

    if (includeUser) {
        where.OR.push({ userId: session.user.id });
    }

    // Add search filter
    if (search) {
        where.AND = [
            {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            },
        ];
    }

    // Cursor pagination
    const items = await prisma.workoutRoutine.findMany({
        where,
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
        orderBy: [
            { isSystem: "desc" }, // System routines first
            { name: "asc" },
        ],
        take: limit + 1, // Fetch one extra to determine if there are more
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = items.length > limit;
    const routines = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? routines[routines.length - 1].id : null;

    return NextResponse.json({
        items: routines,
        nextCursor,
        hasMore,
    });
}
