import { ArrayShape, NumberShape, StringShape } from '../../../main';
import { INVALID } from '../../../main/v1';

describe('ArrayShape', () => {
  test('infers type of an element shape', () => {
    const output: string[] = new ArrayShape(new NumberShape().transform(() => '')).parse([]);
  });

  test('allows an array', () => {
    expect(new ArrayShape(new NumberShape()).validate([1, 2, 3])).toBe(null);
  });

  test('raises if value is not an array', () => {
    expect(new ArrayShape(new NumberShape()).validate('aaa')).toEqual([
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
    expect(new ArrayShape(new NumberShape()).length(2).validate([1])).toEqual([
      {
        code: 'arrayMin',
        path: [],
        input: [1],
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);
    expect(new StringShape().min(2).validate('aa')).toBe(null);
  });

  test('raises if an array does not conform the min length', () => {
    expect(new ArrayShape(new NumberShape()).min(2).validate([1])).toEqual([
      {
        code: 'arrayMin',
        path: [],
        input: [1],
        param: 2,
        message: 'Must have the minimum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayShape(new NumberShape()).min(2).validate([1, 2])).toBe(null);
  });

  test('raises if an array does not conform the max length', () => {
    expect(new ArrayShape(new NumberShape()).max(2).validate([1, 2, 3])).toEqual([
      {
        code: 'arrayMax',
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);

    expect(new ArrayShape(new NumberShape()).max(2).validate([1, 2])).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new ArrayShape(new NumberShape(), { message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
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
    expect(new ArrayShape(new NumberShape()).min(2, { message: 'xxx', meta: 'yyy' }).validate([1])).toEqual([
      {
        code: 'arrayMin',
        path: [],
        input: [1],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for max length issue', () => {
    expect(new ArrayShape(new NumberShape()).max(2, { message: 'xxx', meta: 'yyy' }).validate([1, 2, 3])).toEqual([
      {
        code: 'arrayMax',
        path: [],
        input: [1, 2, 3],
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new ArrayShape(new NumberShape()).min(3, { unsafe: true }).validate(['aaa', 'bbb'])).toEqual([
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
      {
        code: 'arrayMin',
        path: [],
        input: [INVALID, INVALID],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues for async array', async () => {
    const elementShape = new NumberShape().transformAsync(value => Promise.resolve('a' + value));
    const shape = new ArrayShape(elementShape).min(3, { unsafe: true });

    expect(await shape.validateAsync(['aaa', 'bbb'])).toEqual([
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
      {
        code: 'arrayMin',
        path: [],
        input: [INVALID, INVALID],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new ArrayShape(new NumberShape()).min(3).validate(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'type',
        input: 'aaa',
        message: 'Must be a number',
        param: 'number',
        path: [0],
      },
    ]);
  });

  test.skip('raises a single issue for async array in fast mode', async () => {
    const shape = new ArrayShape(new NumberShape().transformAsync(value => Promise.resolve('a' + value))).min(3);

    expect(await shape.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
      {
        code: 'arrayMin',
        path: [],
        input: ['aaa', 'bbb'],
        param: 3,
        message: 'Must have the minimum length of 3',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue from an element in fast mode', () => {
    expect(new ArrayShape(new NumberShape()).validate(['aaa', 'bbb'], { fast: true })).toEqual([
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

  test('raises a single issue for async array from an element in fast mode', async () => {
    const shape = new ArrayShape(new NumberShape().transformAsync(value => Promise.resolve('a' + value)));

    expect(await shape.validateAsync(['aaa', 'bbb'], { fast: true })).toEqual([
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
    const shape = new ArrayShape(new NumberShape());
    const input = [1, 2];

    expect(shape.parse(input)).toBe(input);
  });

  test('copies an array if values have changed', () => {
    const shape = new ArrayShape(new NumberShape().transform(value => value * 2));
    const input = [1, 2];
    const output = shape.parse(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('returns an async array as is', async () => {
    const shape = new ArrayShape(new NumberShape().transformAsync(value => Promise.resolve(value)));
    const input = [1, 2];

    expect(await shape.parseAsync(input)).toBe(input);
  });

  test('copies an async array if values have changed', async () => {
    const shape = new ArrayShape(new NumberShape().transformAsync(value => Promise.resolve(value * 2)));
    const input = [1, 2];
    const output = await shape.parseAsync(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2]);
    expect(output).toEqual([2, 4]);
  });

  test('parses async array in fast mode', async () => {
    const shape = new ArrayShape(new NumberShape().transformAsync(value => Promise.resolve('a' + value)));

    expect(await shape.parseAsync([1, 2], { fast: true })).toEqual(['a1', 'a2']);
  });

  test('does not swallow non-validation errors', () => {
    class MockError {}

    const shape = new ArrayShape(
      new NumberShape().transform((): number => {
        throw new MockError();
      })
    );

    expect(() => shape.validate([1])).toThrow(MockError);
  });

  test('does not swallow non-validation errors in async mode', async () => {
    class MockError {}

    const shape = new ArrayShape(new NumberShape().transformAsync(() => Promise.reject<number>(new MockError())));

    await expect(() => shape.validateAsync([1])).rejects.toEqual(new MockError());
  });

  test('returns an element shape at key', () => {
    const elementShape = new NumberShape();
    const shape = new ArrayShape(elementShape);

    expect(shape.at(1)).toBe(elementShape);
    expect(shape.at(-1)).toBe(null);
    expect(shape.at(0.5)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });
});
