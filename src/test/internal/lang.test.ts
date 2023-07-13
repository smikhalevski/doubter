import { getCanonicalValueOf, isEqual, isEqualOrSubclass, isIterableObject, isValidDate } from '../../main/internal';

describe('isEqual', () => {
  test('checks equality', () => {
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(111, 111)).toBe(true);
    expect(isEqual(111, 222)).toBe(false);
    expect(isEqual({}, {})).toBe(false);
  });

  test('0 is equal -0', () => {
    expect(isEqual(0, -0)).toBe(true);
  });
});

describe('isIterableObject', () => {
  test('returns value type', () => {
    expect(isIterableObject(new Map())).toBe(true);
    expect(isIterableObject(new Set())).toBe(true);
    expect(isIterableObject([])).toBe(true);
    expect(isIterableObject({ [Symbol.iterator]: 111 })).toBe(true);
    expect(isIterableObject({ [Symbol.iterator]: () => null })).toBe(true);
    expect(isIterableObject({ length: null })).toBe(true);
    expect(isIterableObject({ length: 111 })).toBe(true);
    expect(isIterableObject({ length: '111' })).toBe(true);
    expect(isIterableObject({ length: { valueOf: () => 111 } })).toBe(true);

    expect(isIterableObject({ length: undefined })).toBe(false);
    expect(isIterableObject({ length: 'aaa' })).toBe(false);
    expect(isIterableObject('')).toBe(false);
  });
});

describe('isEqualOrSubclass', () => {
  test('returns true if a descendant class', () => {
    expect(isEqualOrSubclass(Number, Number)).toBe(true);
    expect(isEqualOrSubclass(Number, Object)).toBe(true);
    expect(isEqualOrSubclass(Number, String)).toBe(false);
  });
});

describe('isValidDate', () => {
  test('returns true if date and time is not NaN', () => {
    expect(isValidDate(111)).toBe(false);
    expect(isValidDate(new Date(NaN))).toBe(false);
    expect(isValidDate(new Date(111))).toBe(true);
  });
});

describe('getCanonicalValueOf', () => {
  test('unwraps primitives', () => {
    expect(getCanonicalValueOf(new String('aaa'))).toBe('aaa');
    expect(getCanonicalValueOf(new Number(111))).toBe(111);
    expect(getCanonicalValueOf(new Boolean(true))).toBe(true);
  });

  test('preserves objects as is', () => {
    const obj = { valueOf: () => 111 };

    expect(getCanonicalValueOf(obj)).toBe(obj);
  });
});
