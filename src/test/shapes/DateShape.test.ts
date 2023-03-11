import { DateShape, NEVER } from '../../main';
import { CODE_TYPE, MESSAGE_DATE_TYPE } from '../../main/constants';
import { ARRAY, DATE, NUMBER, OBJECT, STRING } from '../../main/utils';

describe('DateShape', () => {
  test('parses date values', () => {
    const value = new Date();

    expect(new DateShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a Date instance', () => {
    expect(new DateShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: DATE, message: MESSAGE_DATE_TYPE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new DateShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: DATE, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('updates input types when coerced', () => {
      const shape = new DateShape().coerce();

      expect(shape.inputTypes).toEqual([DATE, OBJECT, STRING, NUMBER, ARRAY]);
    });

    test('coerces an input', () => {
      expect(new DateShape().coerce().parse(111)).toEqual(new Date(111));
      expect(new DateShape().coerce().parse(new Number(111))).toEqual(new Date(111));
      expect(new DateShape().coerce().parse([new Number(111)])).toEqual(new Date(111));
      expect(new DateShape().coerce().parse('2020-02-02')).toEqual(new Date('2020-02-02'));
      expect(new DateShape().parse('2020-02-02', { coerced: true })).toEqual(new Date('2020-02-02'));
    });

    test('raises an issue if coercion fails', () => {
      expect(new DateShape().coerce().try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_DATE_TYPE, param: DATE }],
      });
    });
  });

  describe('_coerce', () => {
    test('coerces a String wrapper', () => {
      expect(new DateShape()['_coerce'](new String('2020-02-02'))).toEqual(new Date('2020-02-02'));
    });

    test('coerces a string', () => {
      expect(new DateShape()['_coerce']('2020-02-02')).toEqual(new Date('2020-02-02'));
    });

    test('coerces a number', () => {
      expect(new DateShape()['_coerce'](111)).toEqual(new Date(111));
    });

    test('coerces a boolean', () => {
      expect(new DateShape()['_coerce'](true)).toBe(NEVER);
      expect(new DateShape()['_coerce'](false)).toBe(NEVER);
    });

    test('coerces null and undefined values', () => {
      expect(new DateShape()['_coerce'](null)).toBe(NEVER);
      expect(new DateShape()['_coerce'](undefined)).toBe(NEVER);
    });
  });
});
