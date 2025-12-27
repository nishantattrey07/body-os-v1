"use server";

import { auth } from "@/lib/auth";
import { getUserCutoff } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { getClientTimezone, getDayKeyForTimezone, getUTCBoundsForTimezoneDay } from "@/lib/server/timezone";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get client timezone from header
        const timezone = getClientTimezone(request);

        const body = await request.json();
        const { inventoryItemId, qty = 1, mealType } = body;

        if (!inventoryItemId) {
            return Response.json(
                { error: "inventoryItemId is required" },
                { status: 400 }
            );
        }

        // Fetch inventory item to get macros for snapshotting
        const item = await prisma.inventoryItem.findUnique({
            where: { id: inventoryItemId },
        });

        if (!item) {
            return Response.json({ error: "Inventory item not found" }, { status: 404 });
        }

        // Calculate snapshot values (frozen at this moment)
        const snapshot = {
            name: item.name,
            protein: item.proteinPerUnit * qty,
            carbs: item.carbsPerUnit * qty,
            fat: item.fatPerUnit * qty,
            fiber: item.fiberPerUnit * qty,
            sugar: item.sugarPerUnit * qty,
            calories: item.caloriesPerUnit * qty,
            // Optional micronutrients
            sodium: item.sodiumPerUnit ? item.sodiumPerUnit * qty : null,
            cholesterol: item.cholesterolPerUnit ? item.cholesterolPerUnit * qty : null,
        };

        // Create nutrition log with snapshot (timestamp stays as UTC - exact moment)
        const nutritionLog = await prisma.nutritionLog.create({
            data: {
                userId: session.user.id,
                inventoryItemId,
                qty,
                mealType,
                timestamp: new Date(), // UTC - exact moment of logging
                // Snapshot fields
                ...snapshot,
            },
            include: {
                InventoryItem: true,
            },
        });

        // Update daily totals using CLIENT's timezone
        const dailyTotals = await updateDailyNutritionTotals(
            session.user.id,
            timezone
        );

        return Response.json({
            log: nutritionLog,
            dailyTotals: dailyTotals ?? {
                proteinTotal: 0,
                carbsTotal: 0,
                fatsTotal: 0,
                fiberTotal: 0,
                caloriesTotal: 0,
                sodiumTotal: null,
                cholesterolTotal: null,
            },
        });
    } catch (error) {
        console.error("[POST /api/nutrition/log] Error:", error);
        return Response.json(
            { error: "Failed to log nutrition" },
            { status: 500 }
        );
    }
}

/**
 * Update daily nutrition totals by aggregating ALL logs for the day
 * Uses client timezone to determine day boundaries
 */
async function updateDailyNutritionTotals(userId: string, timezone: string) {
    try {
        const cutoff = await getUserCutoff(userId);

        // Get day boundaries using CLIENT's timezone
        const { start, end } = getUTCBoundsForTimezoneDay(timezone, cutoff.hour, cutoff.minute);
        const today = getDayKeyForTimezone(timezone, cutoff.hour, cutoff.minute);

        // Fetch all logs for the day
        const logs = await prisma.nutritionLog.findMany({
            where: {
                userId,
                timestamp: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Aggregate from SNAPSHOT fields (not joins!)
        const totals = logs.reduce(
            (acc, log) => ({
                protein: acc.protein + log.protein,
                carbs: acc.carbs + log.carbs,
                fats: acc.fats + log.fat,
                fiber: acc.fiber + log.fiber,
                calories: acc.calories + log.calories,
                sodium: acc.sodium + (log.sodium || 0),
                cholesterol: acc.cholesterol + (log.cholesterol || 0),
            }),
            { protein: 0, carbs: 0, fats: 0, fiber: 0, calories: 0, sodium: 0, cholesterol: 0 }
        );

        // Upsert daily log using CLIENT's day
        await prisma.dailyLog.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
            update: {
                proteinTotal: totals.protein,
                carbsTotal: totals.carbs,
                fatsTotal: totals.fats,
                fiberTotal: totals.fiber,
                caloriesTotal: totals.calories,
                sodiumTotal: totals.sodium > 0 ? totals.sodium : null,
                cholesterolTotal: totals.cholesterol > 0 ? totals.cholesterol : null,
            },
            create: {
                userId,
                date: today,
                proteinTotal: totals.protein,
                carbsTotal: totals.carbs,
                fatsTotal: totals.fats,
                fiberTotal: totals.fiber,
                caloriesTotal: totals.calories,
                sodiumTotal: totals.sodium > 0 ? totals.sodium : null,
                cholesterolTotal: totals.cholesterol > 0 ? totals.cholesterol : null,
            },
        });

        return {
            proteinTotal: totals.protein,
            carbsTotal: totals.carbs,
            fatsTotal: totals.fats,
            fiberTotal: totals.fiber,
            caloriesTotal: totals.calories,
            sodiumTotal: totals.sodium > 0 ? totals.sodium : null,
            cholesterolTotal: totals.cholesterol > 0 ? totals.cholesterol : null,
        };
    } catch (error) {
        console.error("Failed to update daily nutrition totals:", error);
        return null;
    }
}
