import { ParserOptions, Shape, ValidationError } from '../../main';

describe('Shape', () => {
  test('async shapes throw when used in sync context', () => {
    expect(() => new Shape(true).parse('')).toThrow();
  });

  test('validate returns null if no errors was returned', () => {
    expect(new Shape(false).validate('')).toBe(null);
  });

  test('invokes constraints', () => {
    const shape = new Shape(false).constrain(() => {
      throw new ValidationError([{ code: 'foo' }]);
    });

    expect(shape.validate('')).toEqual([{ code: 'foo', path: [] }]);
  });

  test('passes parsed value to transform', () => {
    const transformerMock = jest.fn(value => value + '_ccc');

    class MockShape extends Shape<any> {
      safeParse(input: unknown, options?: ParserOptions): any {
        return input + '_bbb';
      }
    }

    expect(new MockShape(false).transform(transformerMock).parse('aaa')).toBe('aaa_bbb_ccc');
    expect(transformerMock).toHaveBeenCalledTimes(1);
    expect(transformerMock).toHaveBeenNthCalledWith(1, 'aaa_bbb');
  });

  test('marks type as async', () => {
    expect(new Shape(false).async).toBe(false);
    expect(new Shape(false).transformAsync(Promise.resolve).async).toBe(true);
  });

  test('inherits async status', () => {
    const shape = new Shape(false).transformAsync(Promise.resolve).transform(() => undefined);

    expect(shape.async).toBe(true);
  });
});
