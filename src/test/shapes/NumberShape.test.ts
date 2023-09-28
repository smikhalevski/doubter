import { NEVER, NumberShape } from '../../main';
import { CODE_NUMBER_GT, CODE_NUMBER_MULTIPLE_OF, CODE_TYPE } from '../../main/constants';
import {
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_DATE,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../../main/Type';

describe('NumberShape', () => {
  test('creates a NumberShape', () => {
    const shape = new NumberShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_NUMBER]);
  });

  test('parses a number', () => {
    expect(new NumberShape().parse(111)).toBe(111);
  });

  test('raises if value is not a number', () => {
    expect(new NumberShape().try('111')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '111', param: TYPE_NUMBER, message: Shape.messages['type.number'] }],
    });

    expect(new NumberShape().try(NaN)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: NaN, param: TYPE_NUMBER, message: expect.any(String) }],
    });

    expect(new NumberShape().gt(2).parse(3)).toBe(3);
  });

  test('allows infinity', () => {
    expect(new NumberShape().parse(Infinity)).toBe(Infinity);
  });

  test('overrides message for type issue', () => {
    expect(new NumberShape({ message: 'aaa', meta: 'bbb' }).try('ccc')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'ccc', param: TYPE_NUMBER, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('raises a single issue in an early-return mode', () => {
    expect(new NumberShape().gt(2).multipleOf(3).try(1, { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 1, param: 2, message: 'Must be greater than 2' }],
    });
  });

  test('raises multiple issues', () => {
    expect(new NumberShape().gt(2).multipleOf(3).try(1)).toEqual({
      ok: false,
      issues: [
        { code: CODE_NUMBER_GT, input: 1, param: 2, message: 'Must be greater than 2' },
        { code: CODE_NUMBER_MULTIPLE_OF, input: 1, param: 3, message: 'Must be a multiple of 3' },
      ],
    });
  });

  test('applies operations', () => {
    expect(new NumberShape().check(() => [{ code: 'xxx' }]).try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('supports async validation', async () => {
    await expect(new NumberShape().gt(3).tryAsync(2)).resolves.toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 2, param: 3, message: 'Must be greater than 3' }],
    });
  });

  describe('nan', () => {
    test('allows NaN', () => {
      expect(new NumberShape().nan().try(NaN)).toEqual({ ok: true, value: NaN });
    });

    test('undefined can be used as a default value', () => {
      expect(new NumberShape().nan(undefined).try(NaN)).toEqual({ ok: true, value: undefined });
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      const shape = new NumberShape().coerce();

      expect(shape.inputs).toEqual([
        TYPE_ARRAY,
        TYPE_OBJECT,
        TYPE_NUMBER,
        TYPE_STRING,
        TYPE_BOOLEAN,
        TYPE_BIGINT,
        TYPE_DATE,
        null,
        undefined,
      ]);
    });

    test('coerces an input', () => {
      expect(new NumberShape().coerce().parse('111')).toBe(111);
      expect(new NumberShape().coerce().parse(true)).toBe(1);
      expect(new NumberShape().coerce().parse([111])).toBe(111);
      expect(new NumberShape().parse([111], { coerce: true })).toBe(111);
    });

    test('raises an issue if coercion fails', () => {
      expect(new NumberShape().coerce().try(['aaa'])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: ['aaa'], message: Shape.messages['type.number'], param: TYPE_NUMBER }],
      });
    });
  });

  describe('_coerce', () => {
    test('coerces a Number object', () => {
      expect(new NumberShape()['_coerce'](Number(111))).toBe(111);
      expect(new NumberShape()['_coerce']([Number(111)])).toBe(111);
    });

    test('coerces a String object', () => {
      expect(new NumberShape()['_coerce'](String('111'))).toBe(111);
      expect(new NumberShape()['_coerce']([String('111')])).toBe(111);
    });

    test('coerces a string', () => {
      expect(new NumberShape()['_coerce']('111')).toBe(111);
      expect(new NumberShape()['_coerce']('111.222')).toBe(111.222);

      expect(new NumberShape()['_coerce']('aaa')).toBe(NEVER);
    });

    test('does not coerce NaN', () => {
      expect(new NumberShape()['_coerce'](NaN)).toBe(NEVER);
    });

    test('coerce Infinity only in an unconstrained number mode', () => {
      expect(new NumberShape()['_coerce'](Infinity)).toBe(Infinity);
      expect(new NumberShape()['_coerce']([-Infinity])).toBe(-Infinity);
    });

    test('coerces a boolean', () => {
      expect(new NumberShape()['_coerce'](true)).toBe(1);
      expect(new NumberShape()['_coerce'](false)).toBe(0);
    });

    test('coerces null and undefined values', () => {
      expect(new NumberShape()['_coerce'](null)).toBe(0);
      expect(new NumberShape()['_coerce'](undefined)).toBe(0);
    });

    test('coerces an array with a single number element', () => {
      expect(new NumberShape()['_coerce']([111])).toBe(111);
      expect(new NumberShape()['_coerce'](['111'])).toBe(111);

      expect(new NumberShape()['_coerce']([[111]])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([['111']])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([BigInt(111), 'aaa'])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([BigInt(111), BigInt(111)])).toBe(NEVER);
      expect(new NumberShape()['_coerce'](['aaa'])).toBe(NEVER);
    });

    test('does not coerce objects and functions', () => {
      expect(new NumberShape()['_coerce']({ key1: 111 })).toBe(NEVER);
      expect(new NumberShape()['_coerce'](() => null)).toBe(NEVER);
    });

    test('does not coerce a symbol', () => {
      expect(new NumberShape()['_coerce'](Symbol())).toBe(NEVER);
    });
  });
});
