/**
 * Server-side timezone utilities
 * 
 * These functions help the server understand the client's timezone
 * and calculate "which day" data belongs to based on the user's
 * cutoff time setting.
 */

/**
 * Extract client timezone from request headers
 * Falls back to Asia/Kolkata (IST) if not provided
 */
export function getClientTimezone(request: Request): string {
    return request.headers.get('x-timezone') || 'Asia/Kolkata';
}

/**
 * Get the current time in a specific timezone
 * Returns a Date object representing "now" in that timezone
 * Falls back to UTC if timezone is invalid
 */
export function getNowInTimezone(timezone: string): Date {
    try {
        // Get current UTC time
        const now = new Date();

        // Format in the target timezone to extract components
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const parts = formatter.formatToParts(now);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '0';

        // Create a date with the local time components
        // Note: This date object's internal UTC value won't match,
        // but its getHours(), getDate() etc. will give us what we need
        const localDate = new Date(
            parseInt(get('year')),
            parseInt(get('month')) - 1,
            parseInt(get('day')),
            parseInt(get('hour')),
            parseInt(get('minute')),
            parseInt(get('second'))
        );

        return localDate;
    } catch (error) {
        // Invalid timezone string - fall back to UTC
        console.error(`[Timezone] Invalid timezone "${timezone}", falling back to UTC`, error);
        return new Date();
    }
}

/**
 * Calculate "which day" based on client timezone and cutoff time
 * 
 * @param timezone - Client's timezone (e.g., "Asia/Kolkata")
 * @param cutoffHour - Hour for day boundary (0-23)
 * @param cutoffMinute - Minute for day boundary (0-59)
 * @returns UTC midnight Date for the "logical day"
 * 
 * Example with 5:30 AM cutoff in Asia/Kolkata:
 * - 4:00 AM IST → Returns previous day's UTC midnight
 * - 6:00 AM IST → Returns today's UTC midnight
 */
export function getDayKeyForTimezone(
    timezone: string,
    cutoffHour: number,
    cutoffMinute: number
): Date {
    // Get current time in client's timezone
    const localNow = getNowInTimezone(timezone);

    const hour = localNow.getHours();
    const minute = localNow.getMinutes();

    // Check if current time is before the cutoff
    const isBeforeCutoff =
        (hour < cutoffHour) ||
        (hour === cutoffHour && minute < cutoffMinute);

    let year = localNow.getFullYear();
    let month = localNow.getMonth();
    let day = localNow.getDate();

    if (isBeforeCutoff) {
        // Activities before cutoff belong to previous calendar day
        const adjustedDate = new Date(year, month, day);
        adjustedDate.setDate(adjustedDate.getDate() - 1);

        year = adjustedDate.getFullYear();
        month = adjustedDate.getMonth();
        day = adjustedDate.getDate();
    }

    // Return UTC midnight for that day
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Get date metadata (for WorkoutSession) respecting timezone and cutoff
 */
export function getDateMetadataForTimezone(
    timezone: string,
    cutoffHour: number,
    cutoffMinute: number
): { date: Date; dayOfWeek: number; month: number; year: number; weekOfYear: number } {
    const dayKey = getDayKeyForTimezone(timezone, cutoffHour, cutoffMinute);

    return {
        date: dayKey,
        dayOfWeek: dayKey.getUTCDay(),
        month: dayKey.getUTCMonth() + 1,
        year: dayKey.getUTCFullYear(),
        weekOfYear: getWeekOfYear(dayKey),
    };
}

/**
 * Get UTC day bounds for querying event logs in a timezone
 * 
 * This returns the UTC start/end times that correspond to the
 * logical day boundaries for the given timezone.
 */
export function getUTCBoundsForTimezoneDay(
    timezone: string,
    cutoffHour: number,
    cutoffMinute: number
): { start: Date; end: Date } {
    const dayKey = getDayKeyForTimezone(timezone, cutoffHour, cutoffMinute);

    const year = dayKey.getUTCFullYear();
    const month = dayKey.getUTCMonth();
    const day = dayKey.getUTCDate();

    return {
        start: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999)),
    };
}

// Helper: Get ISO week number
function getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
