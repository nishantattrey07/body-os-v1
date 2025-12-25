export type DistanceUnit = 'm' | 'km' | 'miles';

const CONVERSIONS = {
    m: 1,
    km: 1000,
    miles: 1609.34,
} as const;

/**
 * Increment step values per unit for +/- buttons
 * - small: used for fine adjustments (-1, +1 buttons)
 * - large: used for bigger jumps (-10, +10 buttons)
 */
export const UNIT_INCREMENTS = {
    m: { small: 1, large: 10 },        // +1m, +10m
    km: { small: 0.1, large: 1 },      // +0.1km, +1km
    miles: { small: 0.1, large: 1 },   // +0.1mi, +1mi
} as const;

/**
 * Short labels for compact UI display
 */
export const UNIT_LABELS: Record<DistanceUnit, string> = {
    m: 'm',
    km: 'km',
    miles: 'mi',
} as const;

/**
 * Convert any distance unit to meters (for DB storage)
 * 
 * @param value - The distance value in the given unit
 * @param unit - The unit of the distance ('m', 'km', or 'miles')
 * @returns The distance in meters
 * 
 * @example
 * toMeters(5, 'km') // 5000
 * toMeters(1, 'miles') // 1609.34
 */
export function toMeters(value: number, unit: DistanceUnit): number {
    return value * CONVERSIONS[unit];
}

/**
 * Convert meters to any distance unit (for display)
 * 
 * @param meters - The distance in meters
 * @param unit - The desired output unit
 * @returns The distance in the specified unit, rounded to 2 decimal places
 * 
 * @example
 * fromMeters(5000, 'km') // 5
 * fromMeters(1609.34, 'miles') // 1
 */
export function fromMeters(meters: number, unit: DistanceUnit): number {
    return Math.round((meters / CONVERSIONS[unit]) * 100) / 100; // 2 decimals
}

/**
 * Format distance for display with unit label
 * 
 * @param meters - The distance in meters
 * @param unit - The desired display unit
 * @returns Formatted string like "5 km" or "1.5 miles"
 * 
 * @example
 * formatDistance(5000, 'km') // "5 km"
 * formatDistance(2414.01, 'miles') // "1.5 miles"
 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
    const value = fromMeters(meters, unit);
    return `${value} ${unit}`;
}

/**
 * Validate if a string is a valid distance unit
 */
export function isValidDistanceUnit(unit: string): unit is DistanceUnit {
    return unit === 'm' || unit === 'km' || unit === 'miles';
}
