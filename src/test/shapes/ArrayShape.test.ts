import { ArrayShape, INVALID, NumberShape } from '../../main';
import { CODE_ARRAY_MAX, CODE_ARRAY_MIN, CODE_TYPE, TYPE_ARRAY, TYPE_NUMBER } from '../../main/shapes/constants';

const numberShape = new NumberShape();

const asyncNumberShape = numberShape.convertAsync(value => Promise.resolve(value));

describe('ArrayShape', () => {
  test('infers type of an element shape', () => {
    const output: string[] = new ArrayShape(numberShape.convert(() => '')).parse([]);
  });

  test('infers type of an element shape in async mode', async () => {
    const output: string[] = await new ArrayShape(numberShape.convertAsync(() => Promise.resolve(''))).parseAsync([]);
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

  test('raises multiple issues in the verbose mode', () => {
    expect(new ArrayShape(numberShape).min(3, { unsafe: true }).validate(['aaa', 'bbb'], { verbose: true })).toEqual([
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

  test('raises multiple issues in the verbose async mode', async () => {
    const elementShape = numberShape.convertAsync(value => Promise.resolve('' + value));
    const shape = new ArrayShape(elementShape).min(3, { unsafe: true });

    expect(await shape.validateAsync(['aaa', 'bbb'], { verbose: true })).toEqual([
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

  test('raises a single issue', () => {
    expect(new ArrayShape(numberShape).min(3).validate(['aaa', 'bbb'])).toEqual([
      {
        code: CODE_TYPE,
        input: 'aaa',
        message: expect.any(String),
        param: TYPE_NUMBER,
        path: [0],
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue for an array in an async mode', async () => {
    const shape = new ArrayShape(numberShape.convertAsync(value => Promise.resolve(value))).min(3);

    expect(await shape.validateAsync([111, 222])).toEqual([
      {
        code: CODE_ARRAY_MIN,
        path: [],
        input: [111, 222],
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue from an element', () => {
    expect(new ArrayShape(numberShape).validate(['aaa', 'bbb'])).toEqual([
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

  test('raises a single issue for an array from an element in an async mode', async () => {
    const shape = new ArrayShape(numberShape.convertAsync(value => Promise.resolve('' + value)));

    expect(await shape.validateAsync(['aaa', 'bbb'])).toEqual([
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
    const shape = new ArrayShape(numberShape.convert(value => value * 2));
    const input = [1, 2];
    const output = shape.parse(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('returns an array as is in an async mode', async () => {
    const shape = new ArrayShape(numberShape.convertAsync(value => Promise.resolve(value)));
    const input = [1, 2];

    expect(await shape.parseAsync(input)).toBe(input);
  });

  test('copies an array if values have changed in an async mode', async () => {
    const shape = new ArrayShape(numberShape.convertAsync(value => Promise.resolve(value * 2)));
    const input = [1, 2];
    const output = await shape.parseAsync(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('parses async array in async mode', async () => {
    const shape = new ArrayShape(numberShape.convertAsync(value => Promise.resolve('' + value)));

    expect(await shape.parseAsync([1, 2])).toEqual(['1', '2']);
  });

  test('does not swallow non-validation errors', () => {
    class MockError {}

    const shape = new ArrayShape(
      numberShape.convert((): number => {
        throw new MockError();
      })
    );

    expect(() => shape.validate([1])).toThrow(MockError);
  });

  test('does not swallow non-validation errors in an async mode', async () => {
    class MockError {}

    const shape = new ArrayShape(numberShape.convertAsync(() => Promise.reject<number>(new MockError())));

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
