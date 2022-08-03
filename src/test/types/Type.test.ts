import { ParserOptions, Type } from '../../main';

describe('Type', () => {
  class MockType extends Type<any> {
    parse(input: unknown, options?: ParserOptions): any {}
  }

  test('invokes parse when validated', () => {
    const fn = jest.fn();
    const options: ParserOptions = { fast: true };

    class MockType extends Type<any> {
      parse = fn;
    }

    new MockType(false).validate('aaa', options);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, 'aaa', options);
  });

  test('returns null if no errors were thrown', () => {
    expect(new MockType(false).validate('')).toBe(null);
  });

  test('passes parsed value to transform', () => {
    const fn = jest.fn(value => value + '_ccc');

    class MockType extends Type<any> {
      parse(input: unknown, options?: ParserOptions): any {
        return input + '_bbb';
      }
    }

    expect(new MockType(false).transform(fn).parse('aaa')).toBe('aaa_bbb_ccc');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, 'aaa_bbb');
  });

  test('marks type as async', () => {
    expect(new MockType(false).transform(() => undefined).async).toBe(false);
    expect(new MockType(false).transformAsync(Promise.resolve).async).toBe(true);
  });

  test('inherits async status', () => {
    const type = new MockType(false).transformAsync(Promise.resolve).transform(() => undefined);

    expect(type.async).toBe(true);
  });
});
