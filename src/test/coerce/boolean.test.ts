import { NEVER } from '../../main';
import { coerceToBoolean } from '../../main/coerce/boolean';

describe('coerceToBoolean', () => {
  test('coerces a Boolean object', () => {
    expect(coerceToBoolean(Boolean(true))).toBe(true);
    expect(coerceToBoolean([Boolean(false)])).toBe(false);
  });

  test('coerces a String object', () => {
    expect(coerceToBoolean(String('true'))).toBe(true);
    expect(coerceToBoolean([String('false')])).toBe(false);
  });

  test('coerces a string', () => {
    expect(coerceToBoolean('true')).toBe(true);

    expect(coerceToBoolean('aaa')).toBe(NEVER);
  });

  test('coerces a number', () => {
    expect(coerceToBoolean(1)).toBe(true);
    expect(coerceToBoolean(0)).toBe(false);

    expect(coerceToBoolean(111)).toBe(NEVER);
    expect(coerceToBoolean(NaN)).toBe(NEVER);
    expect(coerceToBoolean(Infinity)).toBe(NEVER);
    expect(coerceToBoolean(-Infinity)).toBe(NEVER);
  });

  test('coerces a boolean', () => {
    expect(coerceToBoolean(true)).toBe(true);
    expect(coerceToBoolean(false)).toBe(false);
  });

  test('coerces null and undefined values', () => {
    expect(coerceToBoolean(null)).toBe(false);
    expect(coerceToBoolean(undefined)).toBe(false);
  });

  test('coerces an array with a single boolean element', () => {
    expect(coerceToBoolean([true])).toBe(true);
    expect(coerceToBoolean([false])).toBe(false);

    expect(coerceToBoolean([[true]])).toBe(NEVER);
    expect(coerceToBoolean([BigInt(111), 'aaa'])).toBe(NEVER);
    expect(coerceToBoolean([BigInt(111), BigInt(111)])).toBe(NEVER);
    expect(coerceToBoolean(['aaa'])).toBe(NEVER);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceToBoolean({ key1: 111 })).toBe(NEVER);
    expect(coerceToBoolean(() => null)).toBe(NEVER);
  });

  test('does not coerce a symbol', () => {
    expect(coerceToBoolean(Symbol())).toBe(NEVER);
  });
});
