import { BigIntShape } from '../../main';
import { CODE_TYPE } from '../../main/constants';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/Type';

describe('BigIntShape', () => {
  test('creates a BigIntShape', () => {
    const shape = new BigIntShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_BIGINT]);
  });

  test('parses bigint values', () => {
    const input = BigInt(111);

    expect(new BigIntShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a bigint', () => {
    expect(new BigIntShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_BIGINT, message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_BIGINT, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      const shape = new BigIntShape().coerce();

      expect(shape.inputs).toEqual([
        TYPE_BIGINT,
        TYPE_OBJECT,
        TYPE_STRING,
        TYPE_NUMBER,
        TYPE_BOOLEAN,
        TYPE_ARRAY,
        null,
        undefined,
      ]);
    });

    test('coerces an input', () => {
      expect(new BigIntShape().coerce().parse(111)).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse(new Number(111))).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse([new Number(111)])).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse(true)).toBe(BigInt(1));
      expect(new BigIntShape().parse(true, { coerce: true })).toBe(BigInt(1));
    });

    test('raises an issue if coercion fails', () => {
      expect(new BigIntShape().coerce().try(['aaa'])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: ['aaa'], message: Shape.messages['type.bigint'], param: TYPE_BIGINT }],
      });
    });
  });
});
