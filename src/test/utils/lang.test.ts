import { canonize, isEqual, isEqualOrSubclass, isIterable, isPlainObject, isValidDate } from '../../main/utils';

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

describe('isPlainObject', () => {
  test('detects plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject({ constructor: () => undefined })).toBe(true);
    expect(isPlainObject([1, 2, 3])).toBe(false);
    expect(isPlainObject(new (class {})())).toBe(false);
  });

  test('returns true for objects with a [[Prototype]] of null', () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  test('returns false for non-Object objects', () => {
    expect(isPlainObject(Error)).toBe(false);
  });

  test('returns false for non-objects', () => {
    expect(isPlainObject(111)).toBe(false);
    expect(isPlainObject('aaa')).toBe(false);
  });
});

describe('isIterable', () => {
  test('returns value type', () => {
    expect(isIterable(new Map())).toBe(true);
    expect(isIterable(new Set())).toBe(true);
    expect(isIterable([])).toBe(true);
    expect(isIterable({ [Symbol.iterator]: 111 })).toBe(true);
    expect(isIterable({ [Symbol.iterator]: () => null })).toBe(true);
    expect(isIterable({ length: null })).toBe(true);
    expect(isIterable({ length: 111 })).toBe(true);
    expect(isIterable({ length: '111' })).toBe(true);
    expect(isIterable({ length: { valueOf: () => 111 } })).toBe(true);

    expect(isIterable({ length: undefined })).toBe(false);
    expect(isIterable({ length: 'aaa' })).toBe(false);
    expect(isIterable('')).toBe(false);
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

describe('canonize', () => {
  test('unwraps primitives', () => {
    expect(canonize(new String('aaa'))).toBe('aaa');
    expect(canonize(new Number(111))).toBe(111);
    expect(canonize(new Boolean(true))).toBe(true);
  });

  test('preserves objects as is', () => {
    const obj = { valueOf: () => 111 };

    expect(canonize(obj)).toBe(obj);
  });
});
