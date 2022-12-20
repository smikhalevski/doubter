import { BooleanShape } from '../../main';
import {
  CODE_TYPE,
  MESSAGE_BOOLEAN_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../../main/constants';
import { coerceBoolean } from '../../main/shapes/BooleanShape';

describe('BooleanShape', () => {
  test('parses boolean values', () => {
    expect(new BooleanShape().parse(true)).toBe(true);
  });

  test('raises an issue if an input is not a boolean', () => {
    expect(new BooleanShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BOOLEAN, message: MESSAGE_BOOLEAN_TYPE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BooleanShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_BOOLEAN, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new BooleanShape().coerce();

    expect(shape['_getInputTypes']()).toEqual([
      TYPE_STRING,
      TYPE_NUMBER,
      TYPE_BOOLEAN,
      TYPE_BIGINT,
      TYPE_ARRAY,
      TYPE_NULL,
      TYPE_UNDEFINED,
    ]);
  });

  test('coerces an input', () => {
    expect(new BooleanShape().coerce().parse(1)).toBe(true);
    expect(new BooleanShape().coerce().parse('true')).toBe(true);
    expect(new BooleanShape().parse('true', { coerced: true })).toBe(true);
  });

  test('raises an issue if coercion fails', () => {
    expect(new BooleanShape().coerce().try(222)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: 222,
          message: MESSAGE_BOOLEAN_TYPE,
          param: TYPE_BOOLEAN,
          path: [],
        },
      ],
    });
  });
});

describe('coerceBoolean', () => {
  test('coerces a string', () => {
    expect(coerceBoolean('aaa', null)).toBe(null);
    expect(coerceBoolean('true', null)).toBe(true);
  });

  test('coerces a number', () => {
    expect(coerceBoolean(1, null)).toBe(true);
    expect(coerceBoolean(0, null)).toBe(false);
    expect(coerceBoolean(111, null)).toBe(null);
    expect(coerceBoolean(NaN, null)).toBe(null);
    expect(coerceBoolean(Infinity, null)).toBe(null);
    expect(coerceBoolean(-Infinity, null)).toBe(null);
  });

  test('coerces a boolean', () => {
    expect(coerceBoolean(true, null)).toBe(true);
    expect(coerceBoolean(false, null)).toBe(false);
  });

  test('coerces null and undefined values', () => {
    expect(coerceBoolean(null, null)).toBe(false);
    expect(coerceBoolean(undefined, null)).toBe(false);
  });

  test('coerces an array with a single boolean element', () => {
    expect(coerceBoolean([true], null)).toBe(true);
    expect(coerceBoolean([false], null)).toBe(false);
  });

  test('does not coerce unsuitable arrays as is', () => {
    expect(coerceBoolean([true, true], null)).toBe(null);
    expect(coerceBoolean([true, 111], null)).toBe(null);
    expect(coerceBoolean([111], null)).toBe(null);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceBoolean({ foo: 111 }, null)).toBe(null);
    expect(coerceBoolean(() => undefined, null)).toBe(null);
  });

  test('does not coerce a symbol', () => {
    expect(coerceBoolean(Symbol(), null)).toBe(null);
  });
});
