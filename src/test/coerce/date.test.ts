import { describe, expect, test } from 'vitest';
import { coerceToDate } from '../../main/coerce/date.ts';
import { NEVER } from '../../main/coerce/never.ts';

describe('coerceToDate', () => {
  test('coerces a String object', () => {
    expect(coerceToDate(new String('2020-02-02'))).toEqual(new Date('2020-02-02'));
  });

  test('coerces a string', () => {
    expect(coerceToDate('2020-02-02')).toEqual(new Date('2020-02-02'));
  });

  test('coerces a number', () => {
    expect(coerceToDate(111)).toEqual(new Date(111));
  });

  test('coerces a boolean', () => {
    expect(coerceToDate(true)).toBe(NEVER);
    expect(coerceToDate(false)).toBe(NEVER);
  });

  test('coerces null and undefined values', () => {
    expect(coerceToDate(null)).toBe(NEVER);
    expect(coerceToDate(undefined)).toBe(NEVER);
  });
});
