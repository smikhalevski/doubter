import { ArrayType, NumberType, StringType } from '../../main';

describe('ArrayType', () => {
  test('allows an array', () => {
    expect(new ArrayType(new NumberType()).validate([1, 2, 3])).toBe(null);
  });

  test('raises if value is not an array', () => {
    expect(new ArrayType(new NumberType()).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'array',
        message: 'Must be an array',
        meta: undefined,
      },
    ]);
  });

  test('raises if string length is not exactly equal', () => {
    expect(new ArrayType(new NumberType()).length(2).validate([1])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: [1],
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);
    expect(new StringType().min(2).validate('aa')).toBe(null);
  });

  test('raises if an array does not conform the min length', () => {
    expect(new ArrayType(new NumberType()).min(2).validate([1])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: [1],
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayType(new NumberType()).min(2).validate([1, 2])).toBe(null);
  });

  test('raises if an array does not conform the max length', () => {
    expect(new ArrayType(new NumberType()).max(2).validate([1, 2, 3])).toEqual([
      {
        code: 'arrayMaxLength',
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayType(new NumberType()).max(2).validate([1, 2])).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new ArrayType(new NumberType(), { message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'array',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min length issue', () => {
    expect(new ArrayType(new NumberType()).min(2, { message: 'xxx', meta: 'yyy' }).validate([1])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: [1],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for max length issue', () => {
    expect(new ArrayType(new NumberType()).max(2, { message: 'xxx', meta: 'yyy' }).validate([1, 2, 3])).toEqual([
      {
        code: 'arrayMaxLength',
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new ArrayType(new NumberType()).min(3).validate(['aaa', 'bbb'])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
      {
        code: 'type',
        path: [0],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues for async array', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve('a' + value))).min(3);

    expect(await type.validateAsync(['aaa', 'bbb'])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
      {
        code: 'type',
        path: [0],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new ArrayType(new NumberType()).min(3).validate(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });

  test.skip('raises a single issue for async array in fast mode', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve('a' + value))).min(3);

    expect(await type.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue from a child in fast mode', () => {
    expect(new ArrayType(new NumberType()).validate(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'type',
        path: [0],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue for async array from a child in fast mode', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve('a' + value)));

    expect(await type.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'type',
        path: [0],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('returns an array as is', () => {
    const type = new ArrayType(new NumberType());
    const input = [1, 2];

    expect(type.parse(input)).toBe(input);
  });

  test('copies an array if values have changed', () => {
    const type = new ArrayType(new NumberType().transform(value => value * 2));
    const input = [1, 2];
    const output = type.parse(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('returns an async array as is', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve(value)));
    const input = [1, 2];

    expect(await type.parse(input)).toBe(input);
  });

  test('copies an async array if values have changed', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve(value * 2)));
    const input = [1, 2];
    const output = await type.parse(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('parses async array in fast mode', async () => {
    const type = new ArrayType(new NumberType().transformAsync(value => Promise.resolve('a' + value)));

    expect(await type.parse([1, 2], { fast: true })).toEqual(['a1', 'a2']);
  });

  test('does not swallow non-validation errors', () => {
    class MockError {}

    const type = new ArrayType(
      new NumberType().transform(() => {
        throw new MockError();
      })
    );

    expect(() => type.validate([1])).toThrow(MockError);
  });

  test('does not swallow non-validation errors in async mode', async () => {
    class MockError {}

    const type = new ArrayType(new NumberType().transformAsync(() => Promise.reject(new MockError())));

    await expect(() => type.validateAsync([1])).rejects.toEqual(new MockError());
  });
});
