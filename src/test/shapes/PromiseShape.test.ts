import { ArrayShape, PromiseShape, StringShape } from '../../main';
import { CODE_TYPE, MESSAGE_ERROR_ASYNC, MESSAGE_PROMISE_TYPE, TYPE_PROMISE } from '../../main/constants';

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
    expect(() => new PromiseShape(new StringShape()).try('aaa')).toThrow(new Error(MESSAGE_ERROR_ASYNC));
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
    expect(checkMock).toHaveBeenNthCalledWith(1, input, { verbose: false });
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
});
