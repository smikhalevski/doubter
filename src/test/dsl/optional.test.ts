import { optional, string } from '../../main';

describe('optional', () => {
  test('allows undefined', () => {
    expect(optional(string()).validate(undefined)).toEqual([]);
  });

  test('returns the default value', () => {
    expect(optional(string(), 'aaa').parse(undefined)).toBe('aaa');
  });

  test('passes defined values to the underlying type', () => {
    expect(optional(string()).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
      },
    ]);
  });

  test('returns Promise that resolves with undefined', async () => {
    const promise = optional(string().transformAsync(() => Promise.resolve(222))).parseAsync(undefined);

    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBe(undefined);
  });

  test('returns Promise that resolves with the default value', async () => {
    const promise = optional(
      string().transformAsync(() => Promise.resolve(222)),
      111
    ).parseAsync(undefined);

    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBe(111);
  });

  test('inherits async status', () => {
    expect(optional(string().transformAsync(() => Promise.resolve(222))).isAsync()).toBe(true);
  });
});
