import { describe, expect, test } from 'vitest';
import { BigIntShape } from '../../main/index.js';
import { bigintCoercibleInputs } from '../../main/coerce/bigint.js';
import { CODE_TYPE_BIGINT, MESSAGE_TYPE_BIGINT } from '../../main/constants.js';
import { Type } from '../../main/Type.js';

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
      issues: [{ code: CODE_TYPE_BIGINT, input: 'aaa', message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_BIGINT, input: 111, message: 'aaa', meta: 'bbb' }],
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
        issues: [{ code: CODE_TYPE_BIGINT, input: ['aaa'], message: MESSAGE_TYPE_BIGINT }],
      });
    });
  });
});
