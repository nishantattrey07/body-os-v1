/**
 * Zod schemas for form validation
 * 
 * Rules:
 * 1. Use Zod for runtime validation
 * 2. Infer TypeScript types from schemas
 * 3. Include helpful error messages
 */

import { z } from 'zod';

/**
 * Exercise Schema
 */
export const exerciseSchema = z.object({
    name: z.string()
        .min(1, 'Exercise name is required')
        .max(100, 'Name too long'),

    category: z.enum([
        'chest',
        'back',
        'legs',
        'shoulders',
        'arms',
        'core',
    ]),

    trackingType: z.enum(['reps', 'duration', 'distance']),

    defaultReps: z.number()
        .min(1, 'Must be at least 1')
        .max(100, 'Must be 100 or less')
        .optional(),

    defaultSets: z.number()
        .min(1)
        .max(10)
        .default(3),

    description: z.string().max(500).optional(),
});

// Infer TypeScript type
export type ExerciseFormData = z.infer<typeof exerciseSchema>;

/**
 * Morning Check-In Schema
 */
export const checkInSchema = z.object({
    weight: z.number()
        .min(30, 'Weight must be at least 30kg')
        .max(300, 'Weight must be less than 300kg'),

    sleepHours: z.number()
        .min(0, 'Cannot be negative')
        .max(24, 'Cannot exceed 24 hours')
        .multipleOf(0.5, 'Use 0.5 hour increments'),

    sleepQuality: z.number()
        .min(1, 'Rate 1-5')
        .max(5, 'Rate 1-5')
        .int()
        .optional(),

    mood: z.enum(['great', 'good', 'okay', 'tired', 'exhausted']).optional(),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

/**
 * Nutrition Log Schema
 */
export const nutritionSchema = z.object({
    itemId: z.string().uuid('Invalid item ID'),

    protein: z.number().min(0).max(1000),
    carbs: z.number().min(0).max(1000),
    fats: z.number().min(0).max(1000),
    calories: z.number().min(0).max(10000),

    quantity: z.number().min(0.1).default(1),
});

export type NutritionFormData = z.infer<typeof nutritionSchema>;

/**
 * User Settings Schema
 */
export const settingsSchema = z.object({
    proteinTarget: z.number().min(50).max(500),
    carbsTarget: z.number().min(50).max(1000),
    fatsTarget: z.number().min(20).max(200),
    caloriesTarget: z.number().min(1000).max(10000),
    waterTarget: z.number().min(1000).max(10000),

    dayCutoffHour: z.number().min(0).max(23),
    dayCutoffMinute: z.number().min(0).max(59),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
