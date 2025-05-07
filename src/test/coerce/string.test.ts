import { describe, expect, test } from 'vitest';
import { NEVER } from '../../main/index.ts';
import { coerceToString } from '../../main/coerce/string.ts';

describe('coerceToString', () => {
  test('returns a string as is', () => {
    expect(coerceToString('aaa')).toBe('aaa');
  });

  test('coerces a String object', () => {
    expect(coerceToString(String('aaa'))).toBe('aaa');
    expect(coerceToString([String('aaa')])).toBe('aaa');
  });

  test('coerces a number', () => {
    expect(coerceToString(111)).toBe('111');
    expect(coerceToString(111.222)).toBe('111.222');

    expect(coerceToString(NaN)).toBe(NEVER);
    expect(coerceToString(Infinity)).toBe(NEVER);
    expect(coerceToString(-Infinity)).toBe(NEVER);
  });

  test('coerces a boolean', () => {
    expect(coerceToString(true)).toBe('true');
    expect(coerceToString(false)).toBe('false');
  });

  test('coerces null and undefined values', () => {
    expect(coerceToString(null)).toBe('');
    expect(coerceToString(undefined)).toBe('');
  });

  test('coerces an array with a single string element', () => {
    expect(coerceToString(['aaa'])).toBe('aaa');
    expect(coerceToString([111])).toBe('111');

    expect(coerceToString([])).toBe(NEVER);
    expect(coerceToString([['aaa']])).toBe(NEVER);
    expect(coerceToString([[111]])).toBe(NEVER);
    expect(coerceToString(['aaa', 'bbb'])).toBe(NEVER);
    expect(coerceToString(['aaa', 111])).toBe(NEVER);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceToString({ valueOf: () => 'aaa' })).toBe(NEVER);
    expect(coerceToString({ key1: 111 })).toBe(NEVER);
    expect(coerceToString(() => null)).toBe(NEVER);
  });

  test('does not coerce a symbol', () => {
    expect(coerceToString(Symbol())).toBe(NEVER);
  });
});
