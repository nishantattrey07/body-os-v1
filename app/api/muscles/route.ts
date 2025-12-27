import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/muscles
 * 
 * Fetches all muscle groups for exercise targeting UI
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all muscle groups ordered by region and name
        const muscles = await prisma.muscleGroup.findMany({
            orderBy: [
                { majorRegion: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({ muscles });
    } catch (error) {
        console.error("[GET /api/muscles] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch muscle groups" },
            { status: 500 }
        );
    }
}
