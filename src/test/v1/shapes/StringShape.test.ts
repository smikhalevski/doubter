import { StringShape } from '../../../main/v1/shapes';
import { ValidationError } from '../../../main/v1/ValidationError';

describe('StringShape', () => {
  test('allows a string', () => {
    expect(new StringShape().validate('aaa')).toBe(null);
  });

  test('raises if value is not a string', () => {
    expect(new StringShape().validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is an instance of String', () => {
    // noinspection JSPrimitiveTypeWrapperUsage
    expect(new StringShape().validate(new String('aaa'))).toEqual([
      {
        code: 'type',
        path: [],
        input: new String('aaa'),
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
  });

  test('raises if string length is not exactly equal', () => {
    expect(new StringShape().length(2).validate('a')).toEqual([
      {
        code: 'stringMinLength',
        path: [],
        input: 'a',
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);
    expect(new StringShape().min(2).validate('aa')).toBe(null);
  });

  test('raises if string length is not greater than', () => {
    expect(new StringShape().min(2).validate('a')).toEqual([
      {
        code: 'stringMinLength',
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
        code: 'stringMaxLength',
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
        code: 'stringRegex',
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
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min length issue', () => {
    expect(new StringShape().min(2, { message: 'xxx', meta: 'yyy' }).validate('a')).toEqual([
      {
        code: 'stringMinLength',
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
        code: 'stringMaxLength',
        path: [],
        input: 'aaa',
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new StringShape().min(3).regex(/aaaa/).validate('aa')).toEqual([
      {
        code: 'stringMinLength',
        path: [],
        input: 'aa',
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
      {
        code: 'stringRegex',
        path: [],
        input: 'aa',
        param: /aaaa/,
        message: 'Must match the pattern /aaaa/',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new StringShape().min(3).regex(/aaaa/).validate('aa', { fast: true })).toEqual([
      {
        code: 'stringMinLength',
        path: [],
        input: 'aa',
        param: 3,
        message: 'Must have the minimum length of 3',
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
    expect(constrainMock).toHaveBeenNthCalledWith(1, 'aa');
  });

  test('supports async validation', async () => {
    expect(await new StringShape().min(3).validateAsync('aa')).toEqual([
      {
        code: 'stringMinLength',
        path: [],
        input: 'aa',
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });
});
