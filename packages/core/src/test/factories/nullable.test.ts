import { nullable, string } from '../../main';

describe('nullable', () => {
  test('allows null', () => {
    expect(nullable(string()).validate(null)).toEqual([]);
  });

  test('passes non-null values to the underlying type', () => {
    expect(nullable(string()).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
      },
    ]);
  });

  test('returns Promise that resolves with null', async () => {
    const promise = nullable(string().transformAsync(() => Promise.resolve(222))).parseAsync(null);

    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBe(null);
  });

  test('inherits async status', () => {
    expect(nullable(string().transformAsync(() => Promise.resolve(222))).isAsync()).toBe(true);
  });
});
