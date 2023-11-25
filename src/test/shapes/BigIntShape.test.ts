import { BigIntShape, Shape } from '../../main';
import { bigintCoercibleInputs } from '../../main/coerce/bigint';
import { CODE_TYPE } from '../../main/constants';
import { Type } from '../../main/Type';

describe('BigIntShape', () => {
  test('creates a BigIntShape', () => {
    const shape = new BigIntShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.BIGINT]);
  });

  test('parses bigint values', () => {
    const input = BigInt(111);

    expect(new BigIntShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a bigint', () => {
    expect(new BigIntShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: Type.BIGINT, message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: Type.BIGINT, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new BigIntShape().coerce().inputs).toBe(bigintCoercibleInputs);
    });

    test('coerces an input', () => {
      expect(new BigIntShape().coerce().parse(111)).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse(new Number(111))).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse([new Number(111)])).toBe(BigInt(111));
      expect(new BigIntShape().coerce().parse(true)).toBe(BigInt(1));
    });

    test('raises an issue if coercion fails', () => {
      expect(new BigIntShape().coerce().try(['aaa'])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: ['aaa'], message: Shape.messages['type.bigint'], param: Type.BIGINT }],
      });
    });
  });
});
