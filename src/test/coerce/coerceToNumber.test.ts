import { NEVER } from '../../main/coerce/NEVER';
import { coerceToNumber } from '../../main/coerce/coerceToNumber';

describe('coerceToNumber', () => {
  test('coerces a Number object', () => {
    expect(coerceToNumber(Number(111))).toBe(111);
    expect(coerceToNumber([Number(111)])).toBe(111);
  });

  test('coerces a String object', () => {
    expect(coerceToNumber(String('111'))).toBe(111);
    expect(coerceToNumber([String('111')])).toBe(111);
  });

  test('coerces a string', () => {
    expect(coerceToNumber('111')).toBe(111);
    expect(coerceToNumber('111.222')).toBe(111.222);

    expect(coerceToNumber('aaa')).toBe(NEVER);
  });

  test('does not coerce NaN', () => {
    expect(coerceToNumber(NaN)).toBe(NEVER);
  });

  test('coerce Infinity only in an unconstrained number mode', () => {
    expect(coerceToNumber(Infinity)).toBe(Infinity);
    expect(coerceToNumber([-Infinity])).toBe(-Infinity);
  });

  test('coerces a boolean', () => {
    expect(coerceToNumber(true)).toBe(1);
    expect(coerceToNumber(false)).toBe(0);
  });

  test('coerces null and undefined values', () => {
    expect(coerceToNumber(null)).toBe(0);
    expect(coerceToNumber(undefined)).toBe(0);
  });

  test('coerces an array with a single number element', () => {
    expect(coerceToNumber([111])).toBe(111);
    expect(coerceToNumber(['111'])).toBe(111);

    expect(coerceToNumber([[111]])).toBe(NEVER);
    expect(coerceToNumber([['111']])).toBe(NEVER);
    expect(coerceToNumber([BigInt(111), 'aaa'])).toBe(NEVER);
    expect(coerceToNumber([BigInt(111), BigInt(111)])).toBe(NEVER);
    expect(coerceToNumber(['aaa'])).toBe(NEVER);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceToNumber({ key1: 111 })).toBe(NEVER);
    expect(coerceToNumber(() => null)).toBe(NEVER);
  });

  test('does not coerce a symbol', () => {
    expect(coerceToNumber(Symbol())).toBe(NEVER);
  });
});
