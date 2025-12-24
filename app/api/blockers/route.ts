import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/blockers
 * Get all active blockers for the current user
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const blockers = await prisma.physicalBlocker.findMany({
            where: {
                userId: session.user.id,
                status: "ACTIVE",
            },
            orderBy: {
                severity: "desc",
            },
        });

        return NextResponse.json({ blockers });
    } catch (error) {
        console.error("[API] Failed to fetch blockers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/blockers
 * Create a new blocker (body issue)
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { name, bodyPart, severity, notes } = data;

        if (!name || !bodyPart || !severity) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const blocker = await prisma.physicalBlocker.create({
            data: {
                userId: session.user.id,
                name,
                bodyPart,
                severity,
                notes,
            },
        });

        return NextResponse.json({ blocker });
    } catch (error) {
        console.error("[API] Failed to create blocker:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
