import { ParserOptions, Shape } from '../../main';

describe('Shape', () => {
  class MockShape extends Shape<any> {
    parse(input: unknown, options?: ParserOptions): any {}
  }

  test('invokes parse when validated', () => {
    const parseMock = jest.fn();
    const options: ParserOptions = { fast: true };

    class MockShape extends Shape<any> {
      parse = parseMock;
    }

    new MockShape(false).validate('aaa', options);

    expect(parseMock).toHaveBeenCalledTimes(1);
    expect(parseMock).toHaveBeenNthCalledWith(1, 'aaa', options);
  });

  test('returns null if no errors were thrown', () => {
    expect(new MockShape(false).validate('')).toBe(null);
  });

  test('passes parsed value to transform', () => {
    const transformerMock = jest.fn(value => value + '_ccc');

    class MockShape extends Shape<any> {
      parse(input: unknown, options?: ParserOptions): any {
        return input + '_bbb';
      }
    }

    expect(new MockShape(false).transform(transformerMock).parse('aaa')).toBe('aaa_bbb_ccc');
    expect(transformerMock).toHaveBeenCalledTimes(1);
    expect(transformerMock).toHaveBeenNthCalledWith(1, 'aaa_bbb');
  });

  test('marks type as async', () => {
    expect(new MockShape(false).transform(() => undefined).async).toBe(false);
    expect(new MockShape(false).transformAsync(Promise.resolve).async).toBe(true);
  });

  test('inherits async status', () => {
    const shape = new MockShape(false).transformAsync(Promise.resolve).transform(() => undefined);

    expect(shape.async).toBe(true);
  });
});
