import { describe, expect, test } from 'vitest';
import { inspect, isUnquotedKey } from '../main/inspect.js';

describe('isUnquotedKey', () => {
  test('returns true if string is an identifier', () => {
    expect(isUnquotedKey('aaa')).toBe(true);
    expect(isUnquotedKey('aaa bbb')).toBe(false);
    expect(isUnquotedKey('$')).toBe(true);
    expect(isUnquotedKey('_')).toBe(true);
    expect(isUnquotedKey('')).toBe(false);
    expect(isUnquotedKey('111')).toBe(true);
    expect(isUnquotedKey(' aaa')).toBe(false);
    expect(isUnquotedKey(' 111')).toBe(false);
    expect(isUnquotedKey('111aaa')).toBe(false);
    expect(isUnquotedKey('aaa111')).toBe(true);
    expect(isUnquotedKey('   ')).toBe(false);
    expect(isUnquotedKey('лол')).toBe(false);
  });
});

describe('inspect', () => {
  test('stringifies primitives', () => {
    expect(inspect(undefined)).toBe('undefined');
    expect(inspect(null)).toBe('null');
    expect(inspect('aaa')).toBe('"aaa"');
    expect(inspect(111)).toBe('111');
    expect(inspect(111.111)).toBe('111.111');
    expect(inspect(NaN)).toBe('NaN');
    expect(inspect(true)).toBe('true');
    expect(inspect(Infinity)).toBe('Infinity');
    expect(inspect(new String('aaa'))).toBe('"aaa"');
    expect(inspect(new Number(111))).toBe('111');
    expect(inspect(new Boolean(true))).toBe('true');
    expect(inspect(Symbol('aaa'))).toBe('Symbol(aaa)');
    expect(inspect(Object(Symbol('aaa')))).toBe('Symbol(aaa)');
  });

  test('stringifies objects', () => {
    expect(inspect({})).toBe('{}');
    expect(inspect({ 111: 'aaa' })).toBe('{ 111: "aaa" }');
    expect(inspect({ aaa: 111 })).toBe('{ aaa: 111 }');
  });

  test('stringifies nested objects', () => {
    expect(inspect({ aaa: { bbb: 111 } })).toBe('{ aaa: { bbb: 111 } }');
  });

  test('wraps key is quotes', () => {
    expect(inspect({ 'aaa bbb': 111 })).toBe('{ "aaa bbb": 111 }');
  });

  test('wraps if string is too long', () => {
    expect(inspect({ ['a'.repeat(40)]: 111, ['b'.repeat(40)]: 222 })).toBe(`{
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: 111,
  bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: 222
}`);
  });

  test('stringifies arrays', () => {
    expect(inspect([])).toBe('[]');
    expect(inspect([111])).toBe('[111]');
    expect(inspect([{ aaa: 111 }])).toBe('[{ aaa: 111 }]');
  });

  test('stringifies symbol and bigint values to string', () => {
    expect(inspect([Symbol('aaa'), BigInt('111')])).toBe('[Symbol(aaa), 111n]');
  });

  test('stringifies circular references', () => {
    const aaa: any = {};
    aaa.bbb = { xxx: { qqq: { vvv: 111 } } };
    aaa.ccc = aaa.bbb;
    aaa.ddd = { yyy: aaa };
    aaa.eee = { zzz: aaa.ddd };
    aaa.fff = {};
    aaa.fff.ggg = aaa.bbb.xxx.qqq;

    expect(inspect(aaa)).toBe(`{
  bbb: { xxx: { qqq: { vvv: 111 } } },
  ccc: #/bbb,
  ddd: { yyy: # },
  eee: { zzz: #/ddd },
  fff: { ggg: #/bbb/xxx/qqq }
}`);
  });

  test('stringifies functions', () => {
    expect(inspect(function () {})).toBe('ƒ ()');

    expect(inspect(() => {})).toBe('ƒ ()');

    expect(inspect(function xxx() {})).toBe('ƒ xxx()');
  });

  test('stringifies Map', () => {
    expect(inspect(new Map().set('aaa', 111).set('bbb', 222))).toBe('Map { ["aaa", 111], ["bbb", 222] }');
  });

  test('stringifies Set', () => {
    expect(inspect(new Set(['aaa', 111]))).toBe('Set { "aaa", 111 }');
  });

  test('stringifies WeakMap', () => {
    expect(inspect(new WeakMap())).toBe('WeakMap {}');
  });

  test('stringifies WeakSet', () => {
    expect(inspect(new WeakSet())).toBe('WeakSet {}');
  });

  test('stringifies class instance without members', () => {
    class TestClass {}
    expect(inspect(new TestClass())).toBe('TestClass {}');
  });

  test('stringifies class instance with enumerable members', () => {
    class TestClass {
      aaa = 111;
    }
    expect(inspect(new TestClass())).toBe('TestClass { aaa: 111 }');
  });

  test('wraps children', () => {
    expect(inspect(new Map().set('aaa', 111).set(222, 333), 2, 11)).toBe(`Map {
  [
    "aaa",
    111
  ],
  [222, 333]
}`);
  });
});
