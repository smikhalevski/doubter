import { deleteArrayIndex, toArrayIndex, uniqueArray } from '../../main/utils';

describe('uniqueArray', () => {
  test('removes duplicates', () => {
    const arr = [1, 2, 3, 3, 1];
    const uniqueArr = uniqueArray(arr);

    expect(uniqueArr).not.toBe(arr);
    expect(uniqueArr).toEqual([1, 2, 3]);
  });

  test('removes NaN duplicates', () => {
    const arr = [NaN, 1, NaN, 2, NaN];
    const uniqueArr = uniqueArray(arr);

    expect(uniqueArr).not.toBe(arr);
    expect(uniqueArr).toEqual([NaN, 1, 2]);
  });
});

describe('deleteArrayIndex', () => {
  test('deletes an element at index', () => {
    const arr = [111, 222, 333];

    expect(deleteArrayIndex(arr, 1)).toBe(arr);
    expect(arr).toEqual([111, 333]);
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
