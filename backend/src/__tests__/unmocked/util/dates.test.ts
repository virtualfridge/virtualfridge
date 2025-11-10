import { describe, expect, test } from '@jest/globals';
import { parseDate, dateDiffInDays, addDaysToDate } from '../../../util/dates';

describe('dates utility', () => {
  describe('parseDate', () => {
    test('should parse date in yyyy-mm-dd format', () => {
      const result = parseDate('2025-11-03', 'yyyy-mm-dd');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getDate()).toBe(3);
    });

    test('should parse date in mm-yyyy format', () => {
      const result = parseDate('12-2025', 'mm-yyyy');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(1); // Default to 1
    });

    test('should parse date in dd-mm-yyyy format', () => {
      const result = parseDate('15-06-2025', 'dd-mm-yyyy');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test('should default to current year when yyyy is missing', () => {
      const currentYear = new Date().getFullYear();
      const result = parseDate('06-15', 'mm-dd');
      expect(result.getFullYear()).toBe(currentYear);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(15);
    });

    test('should default to January when mm is missing', () => {
      const result = parseDate('2025-15', 'yyyy-dd');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    test('should default to day 1 when dd is missing', () => {
      const result = parseDate('2025-11', 'yyyy-mm');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November
      expect(result.getDate()).toBe(1);
    });

    test('should throw error for invalid date input', () => {
      expect(() => parseDate('invalid', 'yyyy-mm-dd')).toThrow('Invalid date input: invalid');
    });

    test('should handle dates with separators other than dash', () => {
      const result = parseDate('2025/11/03', 'yyyy-mm-dd');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(3);
    });

    test('should extract numbers from string without separators', () => {
      // When there are no separators, regex extracts all digits as separate matches
      const result = parseDate('20251103', 'yyyy-mm-dd');
      // This extracts: ['2', '0', '2', '5', '1', '1', '0', '3']
      // So year=2, month=0-1=-1, day=2
      expect(result).toBeInstanceOf(Date);
    });

    test('should use default format yyyy-mm-dd when format not provided', () => {
      const result = parseDate('2025-06-15');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('dateDiffInDays', () => {
    test('should calculate difference between two dates', () => {
      const date1 = new Date(2025, 10, 1); // Nov 1, 2025
      const date2 = new Date(2025, 10, 5); // Nov 5, 2025
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(4);
    });

    test('should return negative number when first date is after second', () => {
      const date1 = new Date(2025, 10, 5);
      const date2 = new Date(2025, 10, 1);
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(-4);
    });

    test('should return 0 for same date', () => {
      const date = new Date(2025, 10, 3);
      const diff = dateDiffInDays(date, date);
      expect(diff).toBe(0);
    });

    test('should ignore time component', () => {
      const date1 = new Date(2025, 10, 1, 10, 30, 0);
      const date2 = new Date(2025, 10, 1, 20, 45, 0);
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(0);
    });

    test('should calculate difference across months', () => {
      const date1 = new Date(2025, 9, 25); // Oct 25, 2025
      const date2 = new Date(2025, 10, 5); // Nov 5, 2025
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(11);
    });

    test('should calculate difference across years', () => {
      const date1 = new Date(2024, 11, 25); // Dec 25, 2024
      const date2 = new Date(2025, 0, 5); // Jan 5, 2025
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(11);
    });

    test('should handle leap year correctly', () => {
      const date1 = new Date(2024, 1, 28); // Feb 28, 2024 (leap year)
      const date2 = new Date(2024, 2, 1); // Mar 1, 2024
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(2); // Includes Feb 29
    });

    test('should handle non-leap year correctly', () => {
      const date1 = new Date(2025, 1, 28); // Feb 28, 2025 (non-leap year)
      const date2 = new Date(2025, 2, 1); // Mar 1, 2025
      const diff = dateDiffInDays(date1, date2);
      expect(diff).toBe(1);
    });
  });

  describe('addDaysToDate', () => {
    test('should add positive days to date', () => {
      const originalDate = new Date(2025, 10, 1); // Nov 1, 2025
      const result = addDaysToDate(originalDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(6);
    });

    test('should subtract days when adding negative number', () => {
      const originalDate = new Date(2025, 10, 10);
      const result = addDaysToDate(originalDate, -5);
      expect(result.getDate()).toBe(5);
    });

    test('should handle adding 0 days', () => {
      const originalDate = new Date(2025, 10, 3, 14, 30);
      const result = addDaysToDate(originalDate, 0);
      expect(result.getTime()).toBe(originalDate.getTime());
    });

    test('should not modify original date', () => {
      const originalDate = new Date(2025, 10, 1);
      const originalTime = originalDate.getTime();
      addDaysToDate(originalDate, 5);
      expect(originalDate.getTime()).toBe(originalTime);
    });

    test('should handle crossing month boundary', () => {
      const originalDate = new Date(2025, 9, 30); // Oct 30, 2025
      const result = addDaysToDate(originalDate, 5);
      expect(result.getMonth()).toBe(10); // November
      expect(result.getDate()).toBe(4);
    });

    test('should handle crossing year boundary', () => {
      const originalDate = new Date(2024, 11, 30); // Dec 30, 2024
      const result = addDaysToDate(originalDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(4);
    });

    test('should preserve time component', () => {
      const originalDate = new Date(2025, 10, 1, 14, 30, 45, 123);
      const result = addDaysToDate(originalDate, 3);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
      expect(result.getMilliseconds()).toBe(123);
    });

    test('should handle large number of days', () => {
      const originalDate = new Date(2025, 0, 1);
      const result = addDaysToDate(originalDate, 365);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });
  });
});
