import { DateShape, Shape } from '../../main';
import { dateCoercibleTypes } from '../../main/coerce/date';
import { CODE_TYPE } from '../../main/constants';
import { TYPE_DATE } from '../../main/Type';

describe('DateShape', () => {
  test('creates a DateShape', () => {
    const shape = new DateShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_DATE]);
  });

  test('parses date values', () => {
    const input = new Date();

    expect(new DateShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a Date instance', () => {
    expect(new DateShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_DATE, message: Shape.messages['type.date'] }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new DateShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_DATE, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new DateShape().coerce().inputs).toBe(dateCoercibleTypes);
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
        issues: [{ code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.date'], param: TYPE_DATE }],
      });
    });
  });
});
