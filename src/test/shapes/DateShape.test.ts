import { DateShape, NEVER } from '../../main';
import { CODE_TYPE, MESSAGE_TYPE_DATE } from '../../main/constants';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/Type';

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
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_DATE, message: MESSAGE_TYPE_DATE }],
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
      const shape = new DateShape().coerce();

      expect(shape.inputs).toEqual([TYPE_DATE, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY]);
    });

    test('coerces an input', () => {
      expect(new DateShape().coerce().parse(111)).toEqual(new Date(111));
      expect(new DateShape().coerce().parse(new Number(111))).toEqual(new Date(111));
      expect(new DateShape().coerce().parse([new Number(111)])).toEqual(new Date(111));
      expect(new DateShape().coerce().parse('2020-02-02')).toEqual(new Date('2020-02-02'));
      expect(new DateShape().parse('2020-02-02', { coerce: true })).toEqual(new Date('2020-02-02'));
    });

    test('raises an issue if coercion fails', () => {
      expect(new DateShape().coerce().try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_TYPE_DATE, param: TYPE_DATE }],
      });
    });
  });

  describe('_coerce', () => {
    test('coerces a String object', () => {
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
