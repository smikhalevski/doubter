import { describe, expect, test } from 'vitest';
import { StringShape } from '../../main/index.ts';
import { stringCoercibleInputs } from '../../main/coerce/string.ts';
import { CODE_STRING_MIN, CODE_STRING_REGEX, CODE_TYPE_STRING, MESSAGE_TYPE_STRING } from '../../main/constants.ts';
import { Type } from '../../main/Type.ts';

describe('StringShape', () => {
  test('creates a string shape', () => {
    const shape = new StringShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.STRING]);
  });

  test('allows a string', () => {
    expect(new StringShape().parse('aaa')).toBe('aaa');
  });

  test('raises if value is not a string', () => {
    expect(new StringShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_STRING, input: 111, message: MESSAGE_TYPE_STRING }],
    });

    expect(new StringShape().parse('aaa')).toBe('aaa');
  });

  test('overrides message for type issue', () => {
    expect(new StringShape({ message: 'xxx', meta: 'yyy' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_STRING, input: 111, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('raises multiple issues', () => {
    expect(new StringShape({}).min(3).regex(/aaaa/).try('aa')).toEqual({
      ok: false,
      issues: [
        { code: CODE_STRING_MIN, input: 'aa', param: 3, message: 'Must have the minimum length of 3' },
        { code: CODE_STRING_REGEX, input: 'aa', param: /aaaa/, message: 'Must match the pattern /aaaa/' },
      ],
    });
  });

  test('raises a single issue in an early-return mode', () => {
    expect(new StringShape().min(3).regex(/aaaa/).try('aa', { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'aa', param: 3, message: 'Must have the minimum length of 3' }],
    });
  });

  test('applies operations', () => {
    const shape = new StringShape().check(() => [{ code: 'xxx' }]);

    expect(shape.try('')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new StringShape().coerce().inputs).toBe(stringCoercibleInputs);
    });

    test('coerces an input', () => {
      expect(new StringShape().coerce().parse(111)).toBe('111');
      expect(new StringShape().coerce().parse(true)).toBe('true');
      expect(new StringShape().coerce().parse(['aaa'])).toBe('aaa');
    });

    test('raises an issue if coercion fails', () => {
      expect(new StringShape().coerce().try([111, 222])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_STRING, input: [111, 222], message: MESSAGE_TYPE_STRING }],
      });
    });
  });
});
