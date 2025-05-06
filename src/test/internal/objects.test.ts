import { describe, expect, test } from 'vitest';
import { cloneObject, cloneRecord, pickKeys, setProperty } from '../../main/internal/objects';

describe('setProperty', () => {
  test('sets object value', () => {
    const obj: any = {};

    setProperty(obj, 'aaa', 111);

    expect(obj.hasOwnProperty('aaa')).toBe(true);
    expect(obj.aaa).toBe(111);
  });

  test('sets __proto__ value', () => {
    const obj: any = {};

    setProperty(obj, '__proto__', 111);

    expect(obj.hasOwnProperty('__proto__')).toBe(true);
    expect(obj.__proto__).toBe(111);
  });
});

describe('cloneObject', () => {
  test('clones all keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneObject(dict);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111, bbb: 222 });
  });

  test('preserves prototype', () => {
    class TestClass {
      aaa = 111;
    }

    const dict = new TestClass();
    dict.aaa = 222;

    const obj = cloneObject(dict);

    expect(dict).not.toBe(obj);
    expect(obj).toBeInstanceOf(TestClass);
    expect(obj.aaa).toBe(222);
  });
});

describe('cloneRecord', () => {
  test('clones limited number of keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneRecord(dict, 1);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111 });
  });

  test('does not copy keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = cloneRecord(dict, 0);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({});
  });

  test('preserves prototype', () => {
    class TestClass {
      aaa = 111;
    }

    const dict = new TestClass();
    dict.aaa = 222;

    const obj = cloneRecord(dict, 1);

    expect(dict).not.toBe(obj);
    expect(obj).toBeInstanceOf(TestClass);
    expect(obj.aaa).toBe(222);
  });
});

describe('pickKeys', () => {
  test('clones existing keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = pickKeys(dict, ['bbb']);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ bbb: 222 });
  });

  test('clones known keys', () => {
    const dict = { aaa: 111, bbb: 222 };
    const obj = pickKeys(dict, ['aaa', 'ccc']);

    expect(dict).not.toBe(obj);
    expect(obj).toEqual({ aaa: 111 });
  });

  test('preserves prototype', () => {
    class TestClass {
      aaa = 111;
      bbb = 222;
    }

    const dict = new TestClass();
    const obj = pickKeys(dict, ['aaa']);

    expect(dict).not.toBe(obj);
    expect(obj).toBeInstanceOf(TestClass);
    expect(obj.aaa).toBe(111);
    expect(obj.bbb).toBeUndefined();
  });
});
