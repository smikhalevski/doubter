import * as d from '../main';
import { ValidationError } from '../main';
import { CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING } from '../main/constants';

describe('guard', () => {
  test('returns a factory for array of shapes', () => {
    const cbFactory = d.guard([d.string(), d.boolean()]);

    const cb = cbFactory((arg1, arg2) => 'aaa');

    expect(cb('bbb', true)).toBe('aaa');
  });

  test('returns a factory for an array shape', () => {
    const cbFactory = d.guard(d.tuple([d.string(), d.boolean()]));

    const cb = cbFactory((arg1, arg2) => 'aaa');

    expect(cb('bbb', true)).toBe('aaa');
  });

  test('returns a factory for a single shape', () => {
    const cbFactory = d.guard(d.string());

    const cb = cbFactory(arg => 'aaa');

    expect(cb('bbb')).toBe('aaa');
  });

  test('returns a callback guarded with an array of shapes', () => {
    const cb = d.guard([d.string(), d.boolean()], (arg1, arg2) => 'aaa');

    expect(cb('bbb', true)).toBe('aaa');
  });

  test('returns a callback guarded with an array shape', () => {
    const cb = d.guard(d.tuple([d.string(), d.boolean()]), (arg1, arg2) => 'aaa');

    expect(cb('bbb', true)).toBe('aaa');
  });

  test('returns a callback guarded with a single shape', () => {
    const cb = d.guard(d.string(), arg => 'aaa');

    expect(cb('bbb')).toBe('aaa');
  });

  test('raises if an argument does not satisfy the shape', () => {
    const cb = d.guard(d.string(), arg => 'aaa');

    expect(() => cb(111 as any)).toThrow(
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

describe('guardAsync', () => {
  test('returns a factory for array of shapes', async () => {
    const cbFactory = d.guardAsync([d.string(), d.boolean()]);

    const cb = cbFactory((arg1, arg2) => 'aaa');

    await expect(cb('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a factory for an array shape', async () => {
    const cbFactory = d.guardAsync(d.tuple([d.string(), d.boolean()]));

    const cb = cbFactory((arg1, arg2) => 'aaa');

    await expect(cb('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a factory for a single shape', async () => {
    const cbFactory = d.guardAsync(d.string());

    const cb = cbFactory(arg => 'aaa');

    await expect(cb('bbb')).resolves.toBe('aaa');
  });

  test('returns a callback guarded with an array of shapes', async () => {
    const cb = d.guardAsync([d.string(), d.boolean()], (arg1, arg2) => 'aaa');

    await expect(cb('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a callback guarded with an array shape', async () => {
    const cb = d.guardAsync(d.tuple([d.string(), d.boolean()]), (arg1, arg2) => 'aaa');

    await expect(cb('bbb', true)).resolves.toBe('aaa');
  });

  test('returns a callback guarded with a single shape', async () => {
    const cb = d.guardAsync(d.string(), arg => 'aaa');

    await expect(cb('bbb')).resolves.toBe('aaa');
  });

  test('raises if an argument does not satisfy the shape', async () => {
    const cb = d.guardAsync(d.string(), arg => 'aaa');

    await expect(cb(111 as any)).rejects.toEqual(
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
