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
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BOOLEAN, message: 'Must be a boolean' }],
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
    expect(coerceBoolean('aaa')).toBe('aaa');
    expect(coerceBoolean('true')).toBe(true);
  });

  test('coerces a number', () => {
    expect(coerceBoolean(1)).toBe(true);
    expect(coerceBoolean(0)).toBe(false);
    expect(coerceBoolean(111)).toBe(111);
    expect(coerceBoolean(NaN)).toBe(NaN);
    expect(coerceBoolean(Infinity)).toBe(Infinity);
    expect(coerceBoolean(-Infinity)).toBe(-Infinity);
  });

  test('coerces a boolean', () => {
    expect(coerceBoolean(true)).toBe(true);
    expect(coerceBoolean(false)).toBe(false);
  });

  test('coerces null and undefined values', () => {
    expect(coerceBoolean(null)).toBe(false);
    expect(coerceBoolean(undefined)).toBe(false);
  });

  test('coerces an array with a single boolean element', () => {
    expect(coerceBoolean([true])).toBe(true);
    expect(coerceBoolean([false])).toBe(false);
  });

  test('does not coerce unsuitable arrays as is', () => {
    const value1 = [true, true];
    const value2 = [true, 111];
    const value3 = [111];

    expect(coerceBoolean(value1)).toBe(value1);
    expect(coerceBoolean(value2)).toBe(value2);
    expect(coerceBoolean(value3)).toBe(value3);
  });

  test('does not coerce objects and functions as is', () => {
    const value1 = { foo: 111 };
    const value2 = () => undefined;

    expect(coerceBoolean(value1)).toBe(value1);
    expect(coerceBoolean(value2)).toBe(value2);
  });

  test('does not coerce a symbol', () => {
    const value = Symbol();

    expect(coerceBoolean(value)).toBe(value);
  });
});
