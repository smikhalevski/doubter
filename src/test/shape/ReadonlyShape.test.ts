import { describe, expect, test } from 'vitest';
import { ReadonlyShape, Shape, StringShape } from '../../main/index.ts';
import { CODE_TYPE_STRING, MESSAGE_TYPE_STRING } from '../../main/constants.ts';

describe('ReadonlyShape', () => {
  test('returns the value from the base shape if parsing succeeds', () => {
    expect(new ReadonlyShape(new StringShape()).parse('bbb')).toBe('bbb');
  });

  test('returns an error from the base shape', () => {
    expect(new ReadonlyShape(new StringShape()).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_STRING, input: 111, message: MESSAGE_TYPE_STRING }],
    });
  });

  test('returns primitives as is', () => {
    expect(new ReadonlyShape(new Shape()).parse(null)).toBe(null);
    expect(new ReadonlyShape(new Shape()).parse(undefined)).toBe(undefined);
    expect(new ReadonlyShape(new Shape()).parse(111)).toBe(111);
    expect(new ReadonlyShape(new Shape()).parse('aaa')).toBe('aaa');
  });

  test('freezes a plain object', () => {
    const input = { key: 'aaa' };
    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).not.toBe(input);
    expect(output).toEqual(input);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(output)).toBe(true);
  });

  test('freezes an object with null prototype', () => {
    const input = Object.create(null);
    input.key = 'aaa';

    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).not.toBe(input);
    expect(output).toEqual(input);
    expect(Object.getPrototypeOf(output)).toBe(null);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(output)).toBe(true);
  });

  test('freezes an array', () => {
    const input = [111, 222];
    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).not.toBe(input);
    expect(output).toEqual(input);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(output)).toBe(true);
  });

  test('does not freeze Map', () => {
    const input = new Map();
    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).toBe(input);
    expect(Object.isFrozen(output)).toBe(false);
  });

  test('does not freeze Set', () => {
    const input = new Set();
    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).toBe(input);
    expect(Object.isFrozen(output)).toBe(false);
  });

  test('does not freeze a class instance', () => {
    const input = new (class {})();
    const output = new ReadonlyShape(new Shape()).parse(input);

    expect(output).toBe(input);
    expect(Object.isFrozen(output)).toBe(false);
  });

  test('freezes an object returned from the base shape', () => {
    const value = { key: 'aaa' };
    const output = new ReadonlyShape(new Shape().convert(() => value)).parse(111);

    expect(output).toBe(value);
    expect(Object.isFrozen(output)).toBe(true);
  });
});
