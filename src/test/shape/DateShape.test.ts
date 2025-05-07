import { describe, expect, test } from 'vitest';
import { DateShape } from '../../main/index.ts';
import { dateCoercibleInputs } from '../../main/coerce/date.ts';
import { CODE_TYPE_DATE, MESSAGE_TYPE_DATE } from '../../main/constants.ts';
import { Type } from '../../main/Type.ts';

describe('DateShape', () => {
  test('creates a DateShape', () => {
    const shape = new DateShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.DATE]);
  });

  test('parses date values', () => {
    const input = new Date();

    expect(new DateShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a Date instance', () => {
    expect(new DateShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_DATE, input: 'aaa', message: MESSAGE_TYPE_DATE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new DateShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_DATE, input: 111, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new DateShape().coerce().inputs).toBe(dateCoercibleInputs);
    });

    test('coerces an input', () => {
      expect(new DateShape().coerce().parse(111)).toEqual(new Date(111));
      expect(new DateShape().coerce().parse(new Number(111))).toEqual(new Date(111));
      expect(new DateShape().coerce().parse([new Number(111)])).toEqual(new Date(111));
      expect(new DateShape().coerce().parse('2020-02-02')).toEqual(new Date('2020-02-02'));
    });

    test('raises an issue if coercion fails', () => {
      expect(new DateShape().coerce().try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_DATE, input: 'aaa', message: MESSAGE_TYPE_DATE }],
      });
    });
  });
});
