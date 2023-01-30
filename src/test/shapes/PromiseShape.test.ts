import { ArrayShape, ObjectShape, PromiseShape, StringShape } from '../../main';
import {
  CODE_TYPE,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_PROMISE_TYPE,
  MESSAGE_STRING_TYPE,
  TYPE_PROMISE,
  TYPE_STRING,
} from '../../main/constants';

describe('PromiseShape', () => {
  test('create a promise shape', () => {
    const shape = new StringShape();
    const promiseShape = new PromiseShape(shape);

    expect(promiseShape.async).toBe(true);
    expect(promiseShape.shape).toBe(shape);
  });

  test('parses a promise', async () => {
    await expect(new PromiseShape(new StringShape()).parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');
  });

  test('does not support sync parsing', () => {
    expect(() => new PromiseShape(new StringShape()).try('aaa')).toThrow(new Error(ERROR_REQUIRES_ASYNC));
  });

  test('raises an issue if value is not a Promise', async () => {
    await expect(new PromiseShape(new StringShape()).tryAsync('aaa')).resolves.toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_PROMISE_TYPE, param: TYPE_PROMISE, path: [] }],
    });
  });

  test('applies checks', async () => {
    const checkMock = jest.fn(() => [{ code: 'xxx' }]);

    const input = Promise.resolve('aaa');
    const promiseShape = new PromiseShape(new StringShape()).check(checkMock);

    await expect(promiseShape.tryAsync(input)).resolves.toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });

    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, input, { verbose: false, coerced: false });
  });

  test('returns the same promise if the resolved value did not change', async () => {
    const arrShape = new ArrayShape(null, new PromiseShape(new StringShape()));

    const arr = [Promise.resolve('aaa')];

    await expect(arrShape.parseAsync(arr)).resolves.toBe(arr);
  });

  test('returns the new promise if the resolved value was transformed', async () => {
    const arrShape = new ArrayShape(null, new PromiseShape(new StringShape().transform(parseFloat)));

    const arr = [Promise.resolve('111.222'), Promise.resolve('333')];

    const output = await arrShape.parseAsync(arr);

    expect(output).not.toBe(arr);
    expect(output[0]).not.toBe(arr[0]);
    expect(output[1]).not.toBe(arr[1]);

    expect(await output[0]).toBe(111.222);
    expect(await output[1]).toBe(333);
  });

  describe('deepPartial', () => {
    test('marks value as optional', async () => {
      const promiseShape = new PromiseShape(new StringShape()).deepPartial();

      await expect(promiseShape.parseAsync(Promise.resolve(undefined))).resolves.toBe(undefined);
      await expect(promiseShape.parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');

      await expect(promiseShape.tryAsync(Promise.resolve(111))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: [] }],
      });
    });

    test('parses deep optional object', async () => {
      const promiseShape = new PromiseShape(new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      await expect(promiseShape.parseAsync(Promise.resolve(undefined))).resolves.toBe(undefined);
      await expect(promiseShape.parseAsync(Promise.resolve({}))).resolves.toEqual({});
      await expect(promiseShape.parseAsync(Promise.resolve({ key1: undefined }))).resolves.toEqual({ key1: undefined });
      await expect(promiseShape.parseAsync(Promise.resolve({ key1: 'aaa' }))).resolves.toEqual({ key1: 'aaa' });

      await expect(promiseShape.tryAsync(Promise.resolve({ key1: 111 }))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: ['key1'] }],
      });
    });
  });
});
