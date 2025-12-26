// Query Key Factory - Prevents typos and enables type safety
// Use these keys everywhere instead of raw strings

export const queryKeys = {
    // Daily log - keyed by date for per-day caching
    dailyLog: (date?: string) => ['daily-log', date ?? 'today'] as const,

    // User settings - singleton query
    userSettings: ['user-settings'] as const,

    // Inventory items - singleton query
    inventory: () => ['inventory'] as const,

    // Workout queries
    activeSession: ['active-session'] as const,
    routines: (params?: { search?: string; filter?: string }) =>
        ['routines', params ?? {}] as const,
    routineById: (id: string) => ['routine', id] as const,
    warmupChecklist: ['warmup-checklist'] as const,

    // Exercises queries
    exercises: (params?: { search?: string; filter?: string; category?: string }) =>
        ['exercises', params ?? {}] as const,
    exerciseCategories: ['exercise-categories'] as const,
} as const;

// Type helpers for invalidation
export type QueryKeys = typeof queryKeys;
