import { deleteAt, toArrayIndex } from '../../main/internal';

describe('deleteAt', () => {
  test('deletes an element at index', () => {
    const arr = [111, 222, 333];

    expect(deleteAt(arr, 1)).toBe(arr);
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
