import { ArrayShape, INVALID, NumberShape } from '../../main';
import { CODE_ARRAY_MAX, CODE_ARRAY_MIN, CODE_TYPE, TYPE_ARRAY, TYPE_NUMBER } from '../../main/shapes/constants';

const numberShape = new NumberShape();

const asyncNumberShape = numberShape.transformAsync(value => Promise.resolve(value));

describe('ArrayShape', () => {
  test('infers type of an element shape', () => {
    const output: string[] = new ArrayShape(numberShape.transform(() => '')).parse([]);
  });

  test('infers type of an element shape in async mode', async () => {
    const output: string[] = await new ArrayShape(numberShape.transformAsync(() => Promise.resolve(''))).parseAsync([]);
  });

  test('allows an array', () => {
    expect(new ArrayShape(numberShape).validate([1, 2, 3])).toBe(null);
  });

  test('allows an array in an async mode', async () => {
    expect(await new ArrayShape(asyncNumberShape).validateAsync([1, 2, 3])).toBe(null);
  });

  test('raises if value is not an array', () => {
    expect(new ArrayShape(numberShape).validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_ARRAY,
        message: 'Must be an array',
        meta: undefined,
      },
    ]);

    expect(new ArrayShape(numberShape).length(2).validate([1, 2])).toBe(null);
  });

  test('raises if an array does not conform the min length', () => {
    expect(new ArrayShape(numberShape).min(2).validate([1])).toEqual([
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: [1],
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayShape(numberShape).min(2).validate([1, 2])).toBe(null);
  });

  test('raises if an array does not conform the max length', () => {
    expect(new ArrayShape(numberShape).max(2).validate([1, 2, 3])).toEqual([
      {
        code: CODE_ARRAY_MAX,
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayShape(numberShape).max(2).validate([1, 2])).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new ArrayShape(numberShape, { message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_ARRAY,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min length issue', () => {
    expect(new ArrayShape(numberShape).min(2, { message: 'xxx', meta: 'yyy' }).validate([1])).toEqual([
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: [1],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for max length issue', () => {
    expect(new ArrayShape(numberShape).max(2, { message: 'xxx', meta: 'yyy' }).validate([1, 2, 3])).toEqual([
      {
        code: CODE_ARRAY_MAX,
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new ArrayShape(numberShape).min(3, { unsafe: true }).validate(['aaa', 'bbb'])).toEqual([
      {
        code: CODE_TYPE,
        path: [0],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        path: [1],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: [INVALID, INVALID],
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues for an array in an async mode', async () => {
    const elementShape = numberShape.transformAsync(value => Promise.resolve('a' + value));
    const shape = new ArrayShape(elementShape).min(3, { unsafe: true });

    expect(await shape.validateAsync(['aaa', 'bbb'])).toEqual([
      {
        code: CODE_TYPE,
        path: [0],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        path: [1],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: [INVALID, INVALID],
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in a fast mode', () => {
    expect(new ArrayShape(numberShape).min(3).validate(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: CODE_TYPE,
        input: 'aaa',
        message: expect.any(String),
        param: TYPE_NUMBER,
        path: [0],
      },
    ]);
  });

  test.skip('raises a single issue for an array in a fast async mode', async () => {
    const shape = new ArrayShape(numberShape.transformAsync(value => Promise.resolve('a' + value))).min(3);

    expect(await shape.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue from an element in a fast mode', () => {
    expect(new ArrayShape(numberShape).validate(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: CODE_TYPE,
        path: [0],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue for an array from an element in a fast async mode', async () => {
    const shape = new ArrayShape(numberShape.transformAsync(value => Promise.resolve('a' + value)));

    expect(await shape.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: CODE_TYPE,
        path: [0],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('returns an array as is', () => {
    const shape = new ArrayShape(numberShape);
    const input = [1, 2];

    expect(shape.parse(input)).toBe(input);
  });

  test('copies an array if values have changed', () => {
    const shape = new ArrayShape(numberShape.transform(value => value * 2));
    const input = [1, 2];
    const output = shape.parse(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('returns an array as is in an async mode', async () => {
    const shape = new ArrayShape(numberShape.transformAsync(value => Promise.resolve(value)));
    const input = [1, 2];

    expect(await shape.parseAsync(input)).toBe(input);
  });

  test('copies an array if values have changed in an async mode', async () => {
    const shape = new ArrayShape(numberShape.transformAsync(value => Promise.resolve(value * 2)));
    const input = [1, 2];
    const output = await shape.parseAsync(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('parses async array in fast async mode', async () => {
    const shape = new ArrayShape(numberShape.transformAsync(value => Promise.resolve('a' + value)));

    expect(await shape.parseAsync([1, 2], { fast: true })).toEqual(['a1', 'a2']);
  });

  test('does not swallow non-validation errors', () => {
    class MockError {}

    const shape = new ArrayShape(
      numberShape.transform((): number => {
        throw new MockError();
      })
    );

    expect(() => shape.validate([1])).toThrow(MockError);
  });

  test('does not swallow non-validation errors in an async mode', async () => {
    class MockError {}

    const shape = new ArrayShape(numberShape.transformAsync(() => Promise.reject<number>(new MockError())));

    await expect(() => shape.validateAsync([1])).rejects.toEqual(new MockError());
  });

  test('returns an element shape at key', () => {
    const shape = new ArrayShape(numberShape);

    expect(shape.at('')).toBe(null);
    expect(shape.at('0')).toBe(numberShape);
    expect(shape.at('1')).toBe(numberShape);
    expect(shape.at('-1')).toBe(null);
    expect(shape.at(1)).toBe(numberShape);
    expect(shape.at(-1)).toBe(null);
    expect(shape.at(0.5)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });
});
