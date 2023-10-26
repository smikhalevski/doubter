import { toArrayIndex, unique } from '../../main/internal/arrays';

describe('unique', () => {
  test('returns an array as is', () => {
    const arr1 = [NaN];
    const arr2 = [1, 2, 3];

    expect(unique(arr1)).toBe(arr1);
    expect(unique(arr2)).toBe(arr2);
  });

  test('returns an array of unique values', () => {
    const arr = [1, 1, 1];
    expect(unique(arr)).not.toBe(arr);
    expect(unique(arr)).toEqual([1]);
  });

  test('preserves the first value entry', () => {
    const arr1 = [NaN, 1, NaN, 2, NaN];
    const arr2 = [1, 2, 1];

    expect(unique(arr1)).not.toBe(arr1);
    expect(unique(arr1)).toEqual([NaN, 1, 2]);

    expect(unique(arr2)).not.toBe(arr2);
    expect(unique(arr2)).toEqual([1, 2]);
  });
});

describe('toArrayIndex', () => {
  test('returns an array index', () => {
    expect(toArrayIndex('0')).toBe(0);
    expect(toArrayIndex('1')).toBe(1);
    expect(toArrayIndex('2')).toBe(2);

    expect(toArrayIndex(0)).toBe(0);
    expect(toArrayIndex(1)).toBe(1);
    expect(toArrayIndex(2)).toBe(2);
  });

  test('returns -1 if value is not an array index', () => {
    expect(toArrayIndex('-5')).toBe(-1);
    expect(toArrayIndex('0xa')).toBe(-1);
    expect(toArrayIndex('016')).toBe(-1);
    expect(toArrayIndex('000')).toBe(-1);
    expect(toArrayIndex('1e+49')).toBe(-1);
    expect(toArrayIndex(-111)).toBe(-1);
    expect(toArrayIndex(111.222)).toBe(-1);
    expect(toArrayIndex('aaa')).toBe(-1);
    expect(toArrayIndex(NaN)).toBe(-1);
    expect(toArrayIndex(new Date())).toBe(-1);
    expect(toArrayIndex({ valueOf: () => 2 })).toBe(-1);
    expect(toArrayIndex({ toString: () => '2' })).toBe(-1);
  });
});
