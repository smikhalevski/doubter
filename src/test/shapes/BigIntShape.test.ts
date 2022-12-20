import { BigIntShape } from '../../main';
import {
  CODE_TYPE,
  MESSAGE_BIGINT_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../../main/constants';
import { coerceBigInt } from '../../main/shapes/BigIntShape';

describe('BigIntShape', () => {
  test('creates a string shape', () => {
    const shape = new BigIntShape();

    expect(shape.checks.length).toBe(0);
    expect(shape.async).toBe(false);
    expect(shape['_getInputTypes']()).toEqual([TYPE_BIGINT]);
  });

  test('parses bigint values', () => {
    const value = BigInt(111);

    expect(new BigIntShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a bigint', () => {
    expect(new BigIntShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BIGINT, message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_BIGINT, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new BigIntShape().coerce();

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
    expect(new BigIntShape().coerce().parse(111)).toBe(BigInt(111));
    expect(new BigIntShape().coerce().parse(true)).toBe(BigInt(1));
    expect(new BigIntShape().parse(true, { coerced: true })).toBe(BigInt(1));

    expect(new BigIntShape().coerce().try(['aaa'])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: ['aaa'],
          message: MESSAGE_BIGINT_TYPE,
          param: TYPE_BIGINT,
          path: [],
        },
      ],
    });
  });

  test('uses a fallback value if coercion fails', () => {
    expect(new BigIntShape().coerce(BigInt(111)).parse(['aaa'])).toBe(BigInt(111));
  });
});

describe('coerceBigInt', () => {
  test('coerces a string', () => {
    expect(coerceBigInt('111')).toBe(BigInt(111));
    expect(coerceBigInt('aaa')).toBe('aaa');
  });

  test('coerces a number', () => {
    expect(coerceBigInt(111)).toBe(BigInt(111));
    expect(coerceBigInt(111.222)).toBe(111.222);
    expect(coerceBigInt(NaN)).toBe(NaN);
    expect(coerceBigInt(Infinity)).toBe(Infinity);
    expect(coerceBigInt(-Infinity)).toBe(-Infinity);
  });

  test('coerces a boolean', () => {
    expect(coerceBigInt(true)).toBe(BigInt(1));
    expect(coerceBigInt(false)).toBe(BigInt(0));
  });

  test('coerces null and undefined values', () => {
    expect(coerceBigInt(null)).toBe(BigInt(0));
    expect(coerceBigInt(undefined)).toBe(BigInt(0));
  });

  test('coerces an array with a single bigint element', () => {
    expect(coerceBigInt([BigInt(111)])).toBe(BigInt(111));
  });

  test('preserves unsuitable arrays as is', () => {
    const value1 = [BigInt(111), 'aaa'];
    const value2 = [BigInt(111), BigInt(111)];
    const value3 = ['aaa'];

    expect(coerceBigInt(value1)).toBe(value1);
    expect(coerceBigInt(value2)).toBe(value2);
    expect(coerceBigInt(value3)).toBe(value3);
  });

  test('preserves objects and functions as is', () => {
    const value1 = { foo: 111 };
    const value2 = () => undefined;

    expect(coerceBigInt(value1)).toEqual(value1);
    expect(coerceBigInt(value2)).toEqual(value2);
  });
});
