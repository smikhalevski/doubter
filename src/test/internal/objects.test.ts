import { cloneDict, cloneDictHead, cloneDictKeys, setSafeProperty } from '../../main/internal/objects';

describe('setSafeProperty', () => {
  test('sets object value', () => {
    const obj: any = {};

    setSafeProperty(obj, 'aaa', 111);

    expect(obj.hasOwnProperty('aaa')).toBe(true);
    expect(obj.aaa).toBe(111);
  });

  test('sets __proto__ value', () => {
    const obj: any = {};

    setSafeProperty(obj, '__proto__', 111);

    expect(obj.hasOwnProperty('__proto__')).toBe(true);
    expect(obj.__proto__).toBe(111);
  });
});

describe('cloneDict', () => {
  test('clones all keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneDict(dict);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111, bbb: 222 });
  });
});

describe('cloneDictHead', () => {
  test('clones limited number of keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneDictHead(dict, 1);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111 });
  });

  test('does not copy keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneDictHead(dict, 0);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({});
  });
});

describe('cloneDictKeys', () => {
  test('clones existing keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneDictKeys(dict, ['bbb']);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ bbb: 222 });
  });

  test('clones known keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneDictKeys(dict, ['aaa', 'ccc']);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111 });
  });
});
