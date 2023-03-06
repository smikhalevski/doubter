import { BooleanShape, NEVER } from '../../main';
import {
  CODE_TYPE,
  MESSAGE_BOOLEAN_TYPE,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../../main/constants';

describe('BooleanShape', () => {
  test('parses boolean values', () => {
    expect(new BooleanShape().parse(true)).toBe(true);
  });

  test('raises an issue if an input is not a boolean', () => {
    expect(new BooleanShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_BOOLEAN, message: MESSAGE_BOOLEAN_TYPE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BooleanShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_BOOLEAN, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new BooleanShape().coerce();

    expect(shape.inputTypes).toEqual([
      TYPE_BOOLEAN,
      TYPE_OBJECT,
      TYPE_STRING,
      TYPE_NUMBER,
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
      issues: [{ code: CODE_TYPE, input: 222, message: MESSAGE_BOOLEAN_TYPE, param: TYPE_BOOLEAN }],
    });
  });

  describe('coercion', () => {
    test('coerces a Boolean wrapper', () => {
      expect(new BooleanShape()['_coerce'](Boolean(true))).toBe(true);
      expect(new BooleanShape()['_coerce']([Boolean(false)])).toBe(false);
    });

    test('coerces a String wrapper', () => {
      expect(new BooleanShape()['_coerce'](String('true'))).toBe(true);
      expect(new BooleanShape()['_coerce']([String('false')])).toBe(false);
    });

    test('coerces a string', () => {
      expect(new BooleanShape()['_coerce']('true')).toBe(true);

      expect(new BooleanShape()['_coerce']('aaa')).toBe(NEVER);
    });

    test('coerces a number', () => {
      expect(new BooleanShape()['_coerce'](1)).toBe(true);
      expect(new BooleanShape()['_coerce'](0)).toBe(false);

      expect(new BooleanShape()['_coerce'](111)).toBe(NEVER);
      expect(new BooleanShape()['_coerce'](NaN)).toBe(NEVER);
      expect(new BooleanShape()['_coerce'](Infinity)).toBe(NEVER);
      expect(new BooleanShape()['_coerce'](-Infinity)).toBe(NEVER);
    });

    test('coerces a boolean', () => {
      expect(new BooleanShape()['_coerce'](true)).toBe(true);
      expect(new BooleanShape()['_coerce'](false)).toBe(false);
    });

    test('coerces null and undefined values', () => {
      expect(new BooleanShape()['_coerce'](null)).toBe(false);
      expect(new BooleanShape()['_coerce'](undefined)).toBe(false);
    });

    test('coerces an array with a single boolean element', () => {
      expect(new BooleanShape()['_coerce']([true])).toBe(true);
      expect(new BooleanShape()['_coerce']([false])).toBe(false);

      expect(new BooleanShape()['_coerce']([[true]])).toBe(NEVER);
      expect(new BooleanShape()['_coerce']([BigInt(111), 'aaa'])).toBe(NEVER);
      expect(new BooleanShape()['_coerce']([BigInt(111), BigInt(111)])).toBe(NEVER);
      expect(new BooleanShape()['_coerce'](['aaa'])).toBe(NEVER);
    });

    test('does not coerce objects and functions', () => {
      expect(new BooleanShape()['_coerce']({ key1: 111 })).toBe(NEVER);
      expect(new BooleanShape()['_coerce'](() => undefined)).toBe(NEVER);
    });

    test('does not coerce a symbol', () => {
      expect(new BooleanShape()['_coerce'](Symbol())).toBe(NEVER);
    });
  });
});
