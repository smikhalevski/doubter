import { ParserOptions, Shape, ValidationError } from '../../main';
import { CODE_NARROWING, MESSAGE_NARROWING } from '../../main/v3/shapes/constants';

describe('Shape', () => {
  class MockShape extends Shape {
    public override _constraints: any[] = [];
  }

  test('the async shape throw when used in the sync context', () => {
    expect(() => new Shape(true).parse('')).toThrow();
  });

  test('validate returns null if no errors were returned', () => {
    expect(new Shape(false).validate('')).toBe(null);
  });

  test('adds the constraint', () => {
    const constraint = () => undefined;

    const shape = new MockShape(false).constrain(constraint);

    expect(shape._constraints).toEqual([undefined, false, constraint]);
  });

  test('adds multiple constraints', () => {
    const constraint0 = () => undefined;
    const constraint1 = () => undefined;

    const shape = new MockShape(false).constrain(constraint0).constrain(constraint1);

    expect(shape._constraints).toEqual([undefined, false, constraint0, undefined, false, constraint1]);
  });

  test('replaces the existing constraint with the same ID', () => {
    const constraint0 = () => undefined;
    const constraint1 = () => undefined;
    const constraint2 = () => undefined;

    const shape = new MockShape(false)
      .constrain(constraint0, { id: 'foo' })
      .constrain(constraint1)
      .constrain(constraint2, { id: 'foo' });

    expect(shape._constraints).toEqual([undefined, false, constraint1, 'foo', false, constraint2]);
  });

  test('adds the narrowing constraint', () => {
    const predicate = (value: unknown) => value === 'aaa';
    const shape = new Shape(false).narrow(predicate);
    const result = shape.safeParse('');

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.issues).toEqual([
      { code: CODE_NARROWING, input: '', message: MESSAGE_NARROWING, path: [], param: predicate },
    ]);
  });

  test('returns true if the value matches the shape', () => {
    const shape = new Shape(false).narrow(value => value === 'aaa');

    expect(shape.is('')).toBe(false);
    expect(shape.is('aaa')).toBe(true);
  });

  test('passes parsed value to the transformer', () => {
    const transformerMock = jest.fn(value => {
      return value + '_ccc';
    });

    class MockShape extends Shape {
      safeParse(input: unknown, options?: ParserOptions): any {
        return input + '_bbb';
      }
    }

    expect(new MockShape(false).transform(transformerMock).parse('aaa')).toBe('aaa_bbb_ccc');
    expect(transformerMock).toHaveBeenCalledTimes(1);
    expect(transformerMock).toHaveBeenNthCalledWith(1, 'aaa_bbb');
  });

  test('returns an error thrown by the transformer', () => {
    const transformerMock = jest.fn(() => {
      throw new ValidationError([{ code: 'foo' }]);
    });

    const result = new Shape(false).transform(transformerMock).safeParse('aaa');

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.issues).toEqual([{ code: 'foo', path: [] }]);
  });

  test('passes parsed value to the transformer in async mode', async () => {
    const transformerMock = jest.fn(async value => {
      return value + '_ccc';
    });

    class MockShape extends Shape {
      safeParse(input: unknown, options?: ParserOptions): any {
        return input + '_bbb';
      }
    }

    expect(await new MockShape(false).transform(transformerMock).parseAsync('aaa')).toBe('aaa_bbb_ccc');
    expect(transformerMock).toHaveBeenCalledTimes(1);
    expect(transformerMock).toHaveBeenNthCalledWith(1, 'aaa_bbb');
  });

  test('returns an error thrown by the transformer in async mode', async () => {
    const transformerMock = jest.fn(async () => {
      throw new ValidationError([{ code: 'foo' }]);
    });

    const result = await new Shape(false).transformAsync(transformerMock).safeParseAsync('aaa');

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.issues).toEqual([{ code: 'foo', path: [] }]);
  });

  test('marks type as async', () => {
    expect(new Shape(false).async).toBe(false);
    expect(new Shape(false).transformAsync(value => Promise.resolve(value)).async).toBe(true);
  });

  test('inherits async status', () => {
    const shape = new Shape(false).transformAsync(value => Promise.resolve(value)).transform(() => undefined);

    expect(shape.async).toBe(true);
  });
});
