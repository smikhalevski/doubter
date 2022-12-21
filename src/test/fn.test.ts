import * as d from '../main';
import { ValidationError } from '../main';
import { CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING } from '../main/constants';

describe('fn', () => {
  test('returns a factory for array of shapes', () => {
    const fnFactory = d.fn([d.string(), d.boolean()]);

    const fn = fnFactory((arg1, arg2) => 'aaa');

    expect(fn('bbb', true)).toBe('aaa');
  });

  test('returns a factory for an array shape', () => {
    const fnFactory = d.fn(d.tuple([d.string(), d.boolean()]));

    const fn = fnFactory((arg1, arg2) => 'aaa');

    expect(fn('bbb', true)).toBe('aaa');
  });

  test('returns a factory for a single shape', () => {
    const fnFactory = d.fn(d.string());

    const fn = fnFactory(arg => 'aaa');

    expect(fn('bbb')).toBe('aaa');
  });

  test('returns a callback guarded with an array of shapes', () => {
    const fn = d.fn([d.string(), d.boolean()], (arg1, arg2) => 'aaa');

    expect(fn('bbb', true)).toBe('aaa');
  });

  test('returns a callback guarded with an array shape', () => {
    const fn = d.fn(d.tuple([d.string(), d.boolean()]), (arg1, arg2) => 'aaa');

    expect(fn('bbb', true)).toBe('aaa');
  });

  test('returns a callback guarded with a single shape', () => {
    const fn = d.fn(d.string(), arg => 'aaa');

    expect(fn('bbb')).toBe('aaa');
  });

  test('raises if an argument does not satisfy the shape', () => {
    const fn = d.fn(d.string(), arg => 'aaa');

    expect(() => fn(111 as any)).toThrow(
      new ValidationError([
        {
          code: CODE_TYPE,
          path: [0],
          input: [111],
          message: MESSAGE_STRING_TYPE,
          param: TYPE_STRING,
          meta: undefined,
        },
      ])
    );
  });
});

describe('fnAsync', () => {
  test('returns a factory for array of shapes', async () => {
    const fnFactory = d.fnAsync([d.string(), d.boolean()]);

    const fn = fnFactory((arg1, arg2) => 'aaa');

    await expect(fn('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a factory for an array shape', async () => {
    const fnFactory = d.fnAsync(d.tuple([d.string(), d.boolean()]));

    const fn = fnFactory((arg1, arg2) => 'aaa');

    await expect(fn('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a factory for a single shape', async () => {
    const fnFactory = d.fnAsync(d.string());

    const fn = fnFactory(arg => 'aaa');

    await expect(fn('bbb')).resolves.toBe('aaa');
  });

  test('returns a callback guarded with an array of shapes', async () => {
    const fn = d.fnAsync([d.string(), d.boolean()], (arg1, arg2) => 'aaa');

    await expect(fn('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a callback guarded with an array shape', async () => {
    const fn = d.fnAsync(d.tuple([d.string(), d.boolean()]), (arg1, arg2) => 'aaa');

    await expect(fn('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a callback guarded with a single shape', async () => {
    const fn = d.fnAsync(d.string(), arg => 'aaa');

    await expect(fn('bbb')).resolves.toBe('aaa');
  });

  test('raises if an argument does not satisfy the shape', async () => {
    const fn = d.fnAsync(d.string(), arg => 'aaa');

    await expect(fn(111 as any)).rejects.toEqual(
      new ValidationError([
        {
          code: CODE_TYPE,
          path: [0],
          input: [111],
          message: MESSAGE_STRING_TYPE,
          param: TYPE_STRING,
          meta: undefined,
        },
      ])
    );
  });
});
