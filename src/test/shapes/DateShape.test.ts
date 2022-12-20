import { DateShape } from '../../main';
import { coerceDate } from '../../main/shapes/DateShape';
import { CODE_TYPE, MESSAGE_DATE_TYPE, TYPE_DATE, TYPE_NUMBER, TYPE_STRING } from '../../main/constants';

describe('DateShape', () => {
  test('parses date values', () => {
    const value = new Date();

    expect(new DateShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a Date instance', () => {
    expect(new DateShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_DATE, message: MESSAGE_DATE_TYPE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new DateShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_DATE, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new DateShape().coerce();

    expect(shape['_getInputTypes']()).toEqual([TYPE_DATE, TYPE_STRING, TYPE_NUMBER]);
  });

  test('coerces an input', () => {
    expect(new DateShape().coerce().parse(111)).toEqual(new Date(111));
    expect(new DateShape().coerce().parse('2020-02-02')).toEqual(new Date('2020-02-02'));
    expect(new DateShape().parse('2020-02-02', { coerced: true })).toEqual(new Date('2020-02-02'));

    expect(new DateShape().coerce().try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: 'aaa',
          message: MESSAGE_DATE_TYPE,
          param: TYPE_DATE,
          path: [],
        },
      ],
    });
  });

  test('uses a fallback value if coercion fails', () => {
    const fallbackDate = new Date();

    expect(new DateShape().coerce(fallbackDate).parse('aaa')).toBe(fallbackDate);
  });
});

describe('coerceDate', () => {
  test('coerces a string', () => {
    expect(coerceDate('aaa')).toBe('aaa');
    expect(coerceDate('2020-02-02')).toEqual(new Date('2020-02-02'));
  });

  test('coerces a number', () => {
    expect(coerceDate(111)).toEqual(new Date(111));
    expect(coerceDate(NaN)).toBe(NaN);
    expect(coerceDate(Infinity)).toBe(Infinity);
    expect(coerceDate(-Infinity)).toBe(-Infinity);
  });

  test('coerces a boolean', () => {
    expect(coerceDate(true)).toBe(true);
    expect(coerceDate(false)).toBe(false);
  });

  test('coerces null and undefined values', () => {
    expect(coerceDate(null)).toBe(null);
    expect(coerceDate(undefined)).toBe(undefined);
  });
});
