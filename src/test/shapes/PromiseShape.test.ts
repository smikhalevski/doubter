import { ObjectShape, Ok, PromiseShape, Shape, StringShape } from '../../main';
import { CODE_TYPE, ERROR_REQUIRES_ASYNC, MESSAGE_PROMISE_TYPE, MESSAGE_STRING_TYPE } from '../../main/constants';
import { PROMISE, STRING } from '../../main/utils/type-system';

describe('PromiseShape', () => {
  test('create a PromiseShape', () => {
    const shape = new Shape();
    const promiseShape = new PromiseShape(shape);

    expect(promiseShape.isAsync).toBe(true);
    expect(promiseShape.shape).toBe(shape);
    expect(promiseShape.inputTypes).toEqual([PROMISE]);
  });

  test('parses a promise', async () => {
    await expect(new PromiseShape(new Shape()).parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');
  });

  test('does not support sync parsing', () => {
    expect(() => new PromiseShape(new Shape()).try('aaa')).toThrow(new Error(ERROR_REQUIRES_ASYNC));
  });

  test('raises an issue if value is not a Promise', async () => {
    await expect(new PromiseShape(new Shape()).tryAsync('aaa')).resolves.toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_PROMISE_TYPE, param: PROMISE }],
    });
  });

  test('applies checks', async () => {
    const checkMock = jest.fn(() => [{ code: 'xxx' }]);

    const input = Promise.resolve('aaa');
    const promiseShape = new PromiseShape(new Shape()).check(checkMock);

    await expect(promiseShape.tryAsync(input)).resolves.toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });

    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, input, undefined, { verbose: false, coerced: false });
  });

  test('applies unsafe checks if value shape raised issues', async () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    const promiseShape = new PromiseShape(shape).check({ unsafe: true }, () => [{ code: 'yyy' }]);

    await expect(promiseShape.tryAsync(Promise.resolve(111), { verbose: true })).resolves.toEqual({
      ok: false,
      issues: [{ code: 'xxx' }, { code: 'yyy' }],
    });
  });

  test('returns the same promise if the resolved value did not change', async () => {
    const promise = Promise.resolve('aaa');

    const result = (await new PromiseShape(new Shape()).tryAsync(promise)) as Ok<unknown>;

    expect(result.value).toBe(promise);
  });

  test('returns the new promise if the resolved value was transformed', async () => {
    const promise = Promise.resolve('aaa');

    const result = (await new PromiseShape(new Shape().transform(() => 111)).tryAsync(promise)) as Ok<unknown>;

    expect(result.value).not.toBe(promise);

    await expect(result.value).resolves.toBe(111);
  });

  describe('coerce', () => {
    test('updates input types when coerced', () => {
      expect(new PromiseShape(new StringShape()).coerce().inputTypes).toEqual([STRING, PROMISE]);
    });

    test('wraps an input value in a promise', async () => {
      const result = (await new PromiseShape(new Shape()).coerce().tryAsync('aaa')) as Ok<unknown>;

      expect(result.value).toBeInstanceOf(Promise);
      await expect(result.value).resolves.toBe('aaa');
    });
  });

  describe('deepPartial', () => {
    test('marks value as optional', async () => {
      const promiseShape = new PromiseShape(new StringShape()).deepPartial();

      await expect(promiseShape.parseAsync(Promise.resolve(undefined))).resolves.toBeUndefined();
      await expect(promiseShape.parseAsync(Promise.resolve('aaa'))).resolves.toBe('aaa');

      await expect(promiseShape.tryAsync(Promise.resolve(111))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: STRING }],
      });
    });

    test('parses deep optional object', async () => {
      const promiseShape = new PromiseShape(new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      await expect(promiseShape.parseAsync(Promise.resolve(undefined))).resolves.toBeUndefined();
      await expect(promiseShape.parseAsync(Promise.resolve({}))).resolves.toEqual({});
      await expect(promiseShape.parseAsync(Promise.resolve({ key1: undefined }))).resolves.toEqual({ key1: undefined });
      await expect(promiseShape.parseAsync(Promise.resolve({ key1: 'aaa' }))).resolves.toEqual({ key1: 'aaa' });

      await expect(promiseShape.tryAsync(Promise.resolve({ key1: 111 }))).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: STRING, path: ['key1'] }],
      });
    });
  });
});
