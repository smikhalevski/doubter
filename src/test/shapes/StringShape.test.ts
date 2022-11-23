import { StringShape } from '../../main';
import { CODE_STRING_MAX, CODE_STRING_MIN, CODE_STRING_REGEX, CODE_TYPE, TYPE_STRING } from '../../main/constants';

describe('StringShape', () => {
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
    const objShape = new StringShape().check(() => [{ code: 'xxx' }]);

    expect(objShape.try('')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });
});
