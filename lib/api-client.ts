/**
 * Client-side API utilities
 * 
 * A fetch wrapper that automatically includes the user's timezone
 * in every request, so the server can calculate correct day boundaries.
 */

/**
 * Get the user's current timezone
 * e.g., "Asia/Kolkata", "America/New_York", "Europe/London"
 */
export function getClientTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get headers that should be included in every API request
 */
export function getTimezoneHeaders(): Record<string, string> {
    return {
        'X-Timezone': getClientTimezone(),
    };
}

/**
 * Fetch wrapper that automatically includes timezone header
 */
export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = {
        ...getTimezoneHeaders(),
        'Content-Type': 'application/json',
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * POST request with timezone header
 */
export async function apiPost<T>(url: string, body: T): Promise<Response> {
    return apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * GET request with timezone header
 */
export async function apiGet(url: string): Promise<Response> {
    return apiFetch(url, {
        method: 'GET',
    });
}
