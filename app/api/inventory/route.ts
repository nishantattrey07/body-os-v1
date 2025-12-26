"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/inventory - Get all active inventory items
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const items = await prisma.inventoryItem.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { isSystem: true },
                ],
                isActive: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return Response.json(items);
    } catch (error) {
        console.error("[GET /api/inventory] Error:", error);
        return Response.json(
            { error: "Failed to fetch inventory" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/inventory - Create new inventory item
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            brand,
            barcode,
            icon,
            proteinPerUnit,
            carbsPerUnit = 0,
            fatPerUnit = 0,
            fiberPerUnit = 0,
            sugarPerUnit = 0,
            caloriesPerUnit,
            sodiumPerUnit = null,
            cholesterolPerUnit = null,
            volumePerUnit,
            defaultUnit,
            costPerUnit = 0,
            maxDailyQty = null,
        } = body;

        // Validation
        if (!name || !icon || proteinPerUnit === undefined || caloriesPerUnit === undefined || !volumePerUnit || !defaultUnit) {
            return Response.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const item = await prisma.inventoryItem.create({
            data: {
                userId: session.user.id,
                name,
                brand,
                barcode,
                icon,
                proteinPerUnit,
                carbsPerUnit,
                fatPerUnit,
                fiberPerUnit,
                sugarPerUnit,
                caloriesPerUnit,
                sodiumPerUnit,
                cholesterolPerUnit,
                volumePerUnit,
                defaultUnit,
                costPerUnit,
                maxDailyQty,
                isActive: true,
                isSystem: false,
            },
        });

        return Response.json(item);
    } catch (error) {
        console.error("[POST /api/inventory] Error:", error);
        return Response.json(
            { error: "Failed to create inventory item" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/inventory - Update inventory item
 * Note: This WON'T affect old nutrition logs (they use snapshots!)
 */
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return Response.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.inventoryItem.findUnique({
            where: { id },
        });

        if (!existing || (existing.userId !== session.user.id && !existing.isSystem)) {
            return Response.json(
                { error: "Inventory item not found or unauthorized" },
                { status: 404 }
            );
        }

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: updateData,
        });

        return Response.json(updated);
    } catch (error) {
        console.error("[PUT /api/inventory] Error:", error);
        return Response.json(
            { error: "Failed to update inventory item" },
            { status: 500 }
        );
    }
}
