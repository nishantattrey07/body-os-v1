/**
 * Timezone Implementation Tests
 * Run with: npm test
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getDateMetadataForTimezone, getDayKeyForTimezone } from '../lib/server/timezone';

describe('Timezone Utilities', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getDayKeyForTimezone', () => {
        test('IST after cutoff - should return today', () => {
            // Mock: 9:15 AM IST on Dec 27 (3:45 AM UTC)
            vi.setSystemTime(new Date('2024-12-27T03:45:00.000Z'));

            const result = getDayKeyForTimezone('Asia/Kolkata', 5, 30);

            // 9:15 AM > 5:30 AM → Dec 27
            expect(result.toISOString()).toBe('2024-12-27T00:00:00.000Z');
        });

        test('IST before cutoff - should return yesterday', () => {
            // Mock: 4:00 AM IST on Dec 28 (10:30 PM UTC Dec 27)
            vi.setSystemTime(new Date('2024-12-27T22:30:00.000Z'));

            const result = getDayKeyForTimezone('Asia/Kolkata', 5, 30);

            // 4:00 AM < 5:30 AM → Dec 27
            expect(result.toISOString()).toBe('2024-12-27T00:00:00.000Z');
        });

        test('Exactly at cutoff - should return today', () => {
            // Mock: 5:30 AM IST on Dec 28 (midnight UTC)
            vi.setSystemTime(new Date('2024-12-28T00:00:00.000Z'));

            const result = getDayKeyForTimezone('Asia/Kolkata', 5, 30);

            // 5:30 AM >= 5:30 AM → Dec 28
            expect(result.toISOString()).toBe('2024-12-28T00:00:00.000Z');
        });

        test('Different timezone (EST)', () => {
            // Mock: 2:00 AM EST on Dec 28 (7:00 AM UTC)
            vi.setSystemTime(new Date('2024-12-28T07:00:00.000Z'));

            const result = getDayKeyForTimezone('America/New_York', 5, 30);

            // 2:00 AM < 5:30 AM → Dec 27
            expect(result.toISOString()).toBe('2024-12-27T00:00:00.000Z');
        });
    });

    describe('getDateMetadataForTimezone', () => {
        test('Returns correct metadata', () => {
            // Friday Dec 27, 10:00 AM IST
            vi.setSystemTime(new Date('2024-12-27T04:30:00.000Z'));

            const result = getDateMetadataForTimezone('Asia/Kolkata', 5, 30);

            expect(result.date.toISOString()).toBe('2024-12-27T00:00:00.000Z');
            expect(result.dayOfWeek).toBe(5); // Friday
            expect(result.month).toBe(12);
            expect(result.year).toBe(2024);
        });
    });
});
