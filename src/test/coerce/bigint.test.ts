import { describe, expect, test } from 'vitest';
import { NEVER } from '../../main/index.js';
import { coerceToBigInt } from '../../main/coerce/bigint.js';

describe('coerceToBigInt', () => {
  test('coerces a String object', () => {
    expect(coerceToBigInt(String('111'))).toBe(BigInt(111));
    expect(coerceToBigInt([String('111')])).toBe(BigInt(111));
  });

  test('coerces a string', () => {
    expect(coerceToBigInt('111')).toBe(BigInt(111));

    expect(coerceToBigInt('aaa')).toBe(NEVER);
  });

  test('coerces a number', () => {
    expect(coerceToBigInt(111)).toBe(BigInt(111));

    expect(coerceToBigInt(111.222)).toBe(NEVER);
    expect(coerceToBigInt(NaN)).toBe(NEVER);
    expect(coerceToBigInt(Infinity)).toBe(NEVER);
    expect(coerceToBigInt(-Infinity)).toBe(NEVER);
  });

  test('coerces a boolean', () => {
    expect(coerceToBigInt(true)).toBe(BigInt(1));
    expect(coerceToBigInt(false)).toBe(BigInt(0));
  });

  test('coerces null and undefined values', () => {
    expect(coerceToBigInt(null)).toBe(BigInt(0));
    expect(coerceToBigInt(undefined)).toBe(BigInt(0));
  });

  test('coerces an array with a single bigint element', () => {
    expect(coerceToBigInt([BigInt(111)])).toBe(BigInt(111));
  });

  test('does not coerce unsuitable array', () => {
    expect(coerceToBigInt([BigInt(111), 'aaa'])).toBe(NEVER);
    expect(coerceToBigInt([BigInt(111), BigInt(111)])).toBe(NEVER);
    expect(coerceToBigInt(['aaa'])).toBe(NEVER);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceToBigInt({ key1: 111 })).toBe(NEVER);
    expect(coerceToBigInt(() => null)).toBe(NEVER);
  });
});
