import { StringShape } from '../../main';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  MESSAGE_STRING_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../../main/constants';
import { coerceString } from '../../main/shapes/StringShape';

describe('StringShape', () => {
  test('creates a string shape', () => {
    const shape = new StringShape();

    expect(shape.checks.length).toBe(0);
    expect(shape.async).toBe(false);
    expect(shape['_getInputTypes']()).toEqual([TYPE_STRING]);
  });

  test('allows a string', () => {
    expect(new StringShape().parse('aaa')).toBe('aaa');
  });

  test('raises if value is not a string', () => {
    expect(new StringShape().try(111)).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE, path: [], input: 111, param: TYPE_STRING, message: 'Must be a string', meta: undefined },
      ],
    });
    expect(new StringShape().min(2).parse('aa')).toBe('aa');
  });

  test('raises if string length is not greater than', () => {
    expect(new StringShape().min(2).try('a')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_MIN,
          path: [],
          input: 'a',
          param: 2,
          message: 'Must have the minimum length of 2',
          meta: undefined,
        },
      ],
    });
    expect(new StringShape().min(2).parse('aa')).toBe('aa');
  });

  test('raises if string length is not less than', () => {
    expect(new StringShape().max(2).try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_MAX,
          path: [],
          input: 'aaa',
          param: 2,
          message: 'Must have the maximum length of 2',
          meta: undefined,
        },
      ],
    });
    expect(new StringShape().max(2).parse('aa')).toBe('aa');
  });

  test('raises if string does not match a pattern', () => {
    expect(new StringShape().regex(/a+/).try('bbb')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_REGEX,
          path: [],
          input: 'bbb',
          param: /a+/,
          message: 'Must match the pattern /a+/',
          meta: undefined,
        },
      ],
    });
    expect(new StringShape().regex(/a+/).parse('aaa')).toBe('aaa');
  });

  test('overrides message for type issue', () => {
    expect(new StringShape({ message: 'xxx', meta: 'yyy' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_STRING, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('overrides message for min length issue', () => {
    expect(new StringShape().min(2, { message: 'xxx', meta: 'yyy' }).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, path: [], input: 'a', param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('overrides message for max length issue', () => {
    expect(new StringShape().max(2, { message: 'xxx', meta: 'yyy' }).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MAX, path: [], input: 'aaa', param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    expect(new StringShape({}).min(3).regex(/aaaa/, { unsafe: true }).try('aa', { verbose: true })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_MIN,
          path: [],
          input: 'aa',
          param: 3,
          message: 'Must have the minimum length of 3',
          meta: undefined,
        },
        {
          code: CODE_STRING_REGEX,
          path: [],
          input: 'aa',
          param: /aaaa/,
          message: 'Must match the pattern /aaaa/',
          meta: undefined,
        },
      ],
    });
  });

  test('raises a single issue', () => {
    expect(new StringShape().min(3).regex(/aaaa/, { unsafe: true }).try('aa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_MIN,
          path: [],
          input: 'aa',
          param: 3,
          message: 'Must have the minimum length of 3',
          meta: undefined,
        },
      ],
    });
  });

  test('applies checks', () => {
    const shape = new StringShape().check(() => [{ code: 'xxx' }]);

    expect(shape.try('')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new StringShape().coerce();

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
    expect(new StringShape().coerce().parse(111)).toBe('111');
    expect(new StringShape().coerce().parse(true)).toBe('true');
    expect(new StringShape().coerce().parse(['aaa'])).toBe('aaa');
    expect(new StringShape().parse(['aaa'], { coerced: true })).toBe('aaa');
  });

  test('raises an issue if coercion fails', () => {
    expect(new StringShape().coerce().try([111, 222])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: [111, 222],
          message: MESSAGE_STRING_TYPE,
          param: TYPE_STRING,
          path: [],
        },
      ],
    });
  });
});

describe('coerceString', () => {
  test('coerces a string', () => {
    expect(coerceString('aaa', null)).toBe('aaa');
  });

  test('coerces a number', () => {
    expect(coerceString(111, null)).toBe('111');
    expect(coerceString(111.222, null)).toBe('111.222');
    expect(coerceString(NaN, null)).toBe(null);
    expect(coerceString(Infinity, null)).toBe(null);
    expect(coerceString(-Infinity, null)).toBe(null);
  });

  test('coerces a boolean', () => {
    expect(coerceString(true, null)).toBe('true');
    expect(coerceString(false, null)).toBe('false');
  });

  test('coerces null and undefined values', () => {
    expect(coerceString(null, null)).toBe('');
    expect(coerceString(undefined, null)).toBe('');
  });

  test('coerces an array with a single string element', () => {
    expect(coerceString(['aaa'], null)).toBe('aaa');
    expect(coerceString([111], null)).toBe('111');
  });

  test('does not coerce unsuitable arrays as is', () => {
    expect(coerceString(['aaa', 'bbb'], null)).toBe(null);
    expect(coerceString(['aaa', 111], null)).toBe(null);
  });

  test('does not coerce objects and functions', () => {
    expect(coerceString({ foo: 111 }, null)).toBe(null);
    expect(coerceString(() => undefined, null)).toBe(null);
  });

  test('does not coerce a symbol', () => {
    expect(coerceString(Symbol(), null)).toBe(null);
  });
});
