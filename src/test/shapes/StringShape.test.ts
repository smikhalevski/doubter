import { StringShape, ValidationError } from '../../main';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  TYPE_STRING,
} from '../../main/v3/shapes/constants';

describe('StringShape', () => {
  test('allows a string', () => {
    expect(new StringShape().validate('aaa')).toBe(null);
  });

  test('raises if value is not a string', () => {
    expect(new StringShape().validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_STRING,
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
    expect(new StringShape().min(2).validate('aa')).toBe(null);
  });

  test('raises if string length is not greater than', () => {
    expect(new StringShape().min(2).validate('a')).toEqual([
      {
        code: CODE_STRING_MIN,
        path: [],
        input: 'a',
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);
    expect(new StringShape().min(2).validate('aa')).toBe(null);
  });

  test('raises if string length is not less than', () => {
    expect(new StringShape().max(2).validate('aaa')).toEqual([
      {
        code: CODE_STRING_MAX,
        path: [],
        input: 'aaa',
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);
    expect(new StringShape().max(2).validate('aa')).toBe(null);
  });

  test('raises if string does not match a pattern', () => {
    expect(new StringShape().regex(/a+/).validate('bbb')).toEqual([
      {
        code: CODE_STRING_REGEX,
        path: [],
        input: 'bbb',
        param: /a+/,
        message: 'Must match the pattern /a+/',
        meta: undefined,
      },
    ]);
    expect(new StringShape().regex(/a+/).validate('aaa')).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new StringShape({ message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_STRING,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min length issue', () => {
    expect(new StringShape().min(2, { message: 'xxx', meta: 'yyy' }).validate('a')).toEqual([
      {
        code: CODE_STRING_MIN,
        path: [],
        input: 'a',
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for max length issue', () => {
    expect(new StringShape().max(2, { message: 'xxx', meta: 'yyy' }).validate('aaa')).toEqual([
      {
        code: CODE_STRING_MAX,
        path: [],
        input: 'aaa',
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues in verbose mode', () => {
    expect(new StringShape({}).min(3).regex(/aaaa/, { unsafe: true }).validate('aa', { verbose: true })).toEqual([
      {
        code: CODE_STRING_MIN,
        path: [],
        input: 'aa',
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_STRING_REGEX,
        path: [],
        input: 'aa',
        param: /aaaa/,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue', () => {
    expect(new StringShape().min(3).regex(/aaaa/, { unsafe: true }).validate('aa')).toEqual([
      {
        code: CODE_STRING_MIN,
        path: [],
        input: 'aa',
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('applies constraints', () => {
    const constrainMock = jest.fn(value => {
      throw new ValidationError([{ code: 'zzz' }]);
    });

    expect(new StringShape().constrain(constrainMock).validate('aa')).toEqual([
      {
        code: 'zzz',
        path: [],
        input: undefined,
        param: undefined,
        message: undefined,
        meta: undefined,
      },
    ]);

    expect(constrainMock).toHaveBeenCalledTimes(1);
    expect(constrainMock).toHaveBeenNthCalledWith(1, 'aa', undefined);
  });

  test('supports async validation', async () => {
    expect(await new StringShape().min(3).validateAsync('aa')).toEqual([
      {
        code: CODE_STRING_MIN,
        path: [],
        input: 'aa',
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });
});
