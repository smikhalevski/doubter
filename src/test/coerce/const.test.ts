import { describe, expect, test } from 'vitest';
import { NEVER } from '../../main';
import { coerceToConst } from '../../main/coerce/const';

describe('coerceToConst', () => {
  test('coerces to a bigint', () => {
    expect(coerceToConst(BigInt(111), '111')).toBe(BigInt(111));
    expect(coerceToConst(BigInt(111), ['111'])).toBe(BigInt(111));
  });

  test('coerces to a number', () => {
    expect(coerceToConst(111, '111')).toBe(111);
    expect(coerceToConst(111, ['111'])).toBe(111);
    expect(coerceToConst(111, new Number(111))).toBe(111);
    expect(coerceToConst(NaN, new Number(NaN))).toBe(NaN);
    expect(coerceToConst(NaN, NaN)).toBe(NaN);
  });

  test('coerces to a string', () => {
    expect(coerceToConst('111', 111)).toBe('111');
    expect(coerceToConst('111', [111])).toBe('111');
  });

  test('coerces to a boolean', () => {
    expect(coerceToConst(true, 'true')).toBe(true);
    expect(coerceToConst(true, ['true'])).toBe(true);
    expect(coerceToConst(true, 1)).toBe(true);
  });

  test('coerces to a Date', () => {
    const value = new Date(1698059765298);

    expect(coerceToConst(value, value)).toBe(value);
    expect(coerceToConst(value, 1698059765298)).toBe(value);
    expect(coerceToConst(value, '2023-10-23T11:16:05.298Z')).toBe(value);
    expect(coerceToConst(value, [value])).toBe(value);
    expect(coerceToConst(value, [1698059765298])).toBe(value);
    expect(coerceToConst(value, ['2023-10-23T11:16:05.298Z'])).toBe(value);
    expect(coerceToConst(value, new Date())).toBe(NEVER);
  });
});
