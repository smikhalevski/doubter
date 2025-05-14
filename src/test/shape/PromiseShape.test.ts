import { describe, expect, test, vi } from 'vitest';
import { ObjectShape, Ok, PromiseShape, Shape, StringShape } from '../../main/index.js';
import {
  CODE_TYPE_PROMISE,
  CODE_TYPE_STRING,
  MESSAGE_TYPE_PROMISE,
  MESSAGE_TYPE_STRING,
} from '../../main/constants.js';
import { Type } from '../../main/Type.js';
import { AsyncMockShape } from './mocks.js';

describe('PromiseShape', () => {
  test('creates a PromiseShape', () => {
    const valueShape = new Shape();
    const shape = new PromiseShape(valueShape);

    expect(shape.isAsync).toBe(true);
    expect(shape.valueShape).toBe(valueShape);
    expect(shape.inputs).toEqual([Type.PROMISE]);
  });

  test('creates a non-async PromiseShape', () => {
    const shape = new PromiseShape(null);

    expect(shape.isAsync).toBe(false);
    expect(shape.valueShape).toBe(null);
    expect(shape.inputs).toEqual([Type.PROMISE]);
  });

  test('raises an issue if value is not a Promise', () => {
    expect(new PromiseShape(null).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_PROMISE, input: 'aaa', message: MESSAGE_TYPE_PROMISE }],
    });
  });

  test('applies operations', () => {
    const cbMock = vi.fn(() => [{ code: 'xxx' }]);

    const input = Promise.resolve('aaa');
    const shape = new PromiseShape(null).check(cbMock);

    expect(shape.try(input)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, input, undefined, { earlyReturn: false });
  });

  test('returns the same promise if the resolved value did not change', () => {
    const input = Promise.resolve('aaa');

    const result = new PromiseShape(null).try(input) as Ok;

    expect(result.value).toBe(input);
  });

  describe('inputs', () => {
    test('infers the promise type', () => {
      expect(new PromiseShape(null).inputs).toEqual([Type.PROMISE]);
      expect(new PromiseShape(new Shape()).inputs).toEqual([Type.PROMISE]);
    });
  });

  describe('coerce', () => {
    test('infers the coerced promise type', () => {
      expect(new PromiseShape(null).coerce().inputs).toEqual([Type.UNKNOWN]);
      expect(new PromiseShape(new StringShape()).coerce().inputs).toEqual([Type.STRING, Type.PROMISE]);
    });

    test('wraps an input value in a promise', async () => {
      const result = new PromiseShape(null).coerce().try('aaa') as Ok;

      expect(result.value).toBeInstanceOf(Promise);
      await expect(result.value).resolves.toBe('aaa');
    });
  });

  describe('deepPartial', () => {
    test('marks value as optional', async () => {
      const shape = new PromiseShape(new StringShape()).deepPartial();

      await expect(shape.parseAsync(Promise.resolve(undefined))).resolves.toBeUndefined();
      await expect(shape.parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');

      await expect(shape.tryAsync(Promise.resolve(111))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_STRING, input: 111, message: MESSAGE_TYPE_STRING }],
      });
    });

    test('parses deep optional object', async () => {
      const shape = new PromiseShape(new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      await expect(shape.parseAsync(Promise.resolve(undefined))).resolves.toBeUndefined();
      await expect(shape.parseAsync(Promise.resolve({}))).resolves.toEqual({});
      await expect(shape.parseAsync(Promise.resolve({ key1: undefined }))).resolves.toEqual({ key1: undefined });
      await expect(shape.parseAsync(Promise.resolve({ key1: 'aaa' }))).resolves.toEqual({ key1: 'aaa' });

      await expect(shape.tryAsync(Promise.resolve({ key1: 111 }))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_STRING, input: 111, message: MESSAGE_TYPE_STRING, path: ['key1'] }],
      });
    });
  });

  describe('async', () => {
    test('parses a promise', async () => {
      await expect(new PromiseShape(new Shape()).parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');
    });

    test('raises an issue if value is not a Promise', async () => {
      await expect(new PromiseShape(new Shape()).tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_PROMISE, input: 'aaa', message: MESSAGE_TYPE_PROMISE }],
      });
    });

    test('applies operations', async () => {
      const checkMock = vi.fn(() => [{ code: 'xxx' }]);

      const input = Promise.resolve('aaa');
      const shape = new PromiseShape(new Shape()).check(checkMock);

      await expect(shape.tryAsync(input)).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });

      expect(checkMock).toHaveBeenCalledTimes(1);
      expect(checkMock).toHaveBeenNthCalledWith(1, input, undefined, { earlyReturn: false });
    });

    test('returns the same promise if the resolved value did not change', async () => {
      const input = Promise.resolve('aaa');

      const result = (await new PromiseShape(new Shape()).tryAsync(input)) as Ok;

      expect(result.value).toBe(input);
    });

    test('returns the new promise if the resolved value was converted', async () => {
      const input = Promise.resolve('aaa');

      const result = (await new PromiseShape(new Shape().convert(() => 111)).tryAsync(input)) as Ok;

      expect(result.value).not.toBe(input);

      await expect(result.value).resolves.toBe(111);
    });

    test('does not swallow errors', async () => {
      const shape = new PromiseShape(
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        })
      );

      await expect(shape.tryAsync(Promise.resolve(111))).rejects.toEqual(new Error('expected'));
    });

    describe('coerce', () => {
      test('wraps an input value in a promise', async () => {
        const result = (await new PromiseShape(new Shape()).coerce().tryAsync('aaa')) as Ok;

        expect(result.value).toBeInstanceOf(Promise);
        await expect(result.value).resolves.toBe('aaa');
      });
    });
  });
});
