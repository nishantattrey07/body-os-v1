import { auth } from "@/lib/auth";
import { DEFAULTS } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/settings
 * 
 * Fetch user settings, create with defaults if doesn't exist
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
        });

        // Create default settings if user doesn't have any
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id,
                    ...DEFAULTS,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("[API] Failed to fetch settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
