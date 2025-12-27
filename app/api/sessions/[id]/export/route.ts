import { auth } from "@/lib/auth";
import { getFormattedSessionData } from "@/lib/utils/exportSession";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sessions/[id]/export
 * 
 * Export formatted session data as JSON
 * 
 * Usage: http://localhost:3000/api/sessions/YOUR_SESSION_ID/export
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionId = (await params).id;
        const data = await getFormattedSessionData(sessionId);

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(data, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="session-${sessionId}.json"`
            }
        });
    } catch (error) {
        console.error("[GET /api/sessions/[id]/export] Error:", error);
        return NextResponse.json(
            { error: "Failed to export session" },
            { status: 500 }
        );
    }
}
