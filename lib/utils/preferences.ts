import { DistanceUnit } from './distance';

const STORAGE_KEY = 'userPreferences';

interface UserPreferences {
    preferredDistanceUnit: DistanceUnit;
    preferredWeightUnit: 'kg' | 'lbs';
}

const DEFAULT_PREFERENCES: UserPreferences = {
    preferredDistanceUnit: 'm',
    preferredWeightUnit: 'kg',
};

/**
 * Get user preferences from localStorage with fallback to defaults
 */
export function getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
        return DEFAULT_PREFERENCES;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to parse user preferences:', error);
    }

    return DEFAULT_PREFERENCES;
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return;

    try {
        const current = getUserPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save user preferences:', error);
    }
}

/**
 * Get preferred distance unit
 */
export function getPreferredDistanceUnit(): DistanceUnit {
    return getUserPreferences().preferredDistanceUnit;
}

/**
 * Set preferred distance unit
 */
export function setPreferredDistanceUnit(unit: DistanceUnit): void {
    saveUserPreferences({ preferredDistanceUnit: unit });
}
