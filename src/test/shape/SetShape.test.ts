import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ObjectShape, Ok, SetShape, Shape, StringShape } from '../../main/index.js';
import { CODE_TYPE_SET, CODE_TYPE_STRING, MESSAGE_TYPE_SET, MESSAGE_TYPE_STRING } from '../../main/constants.js';
import { resetNonce } from '../../main/internal/shapes.js';
import { Type } from '../../main/Type.js';
import { AsyncMockShape, MockShape } from './mocks.js';

describe('SetShape', () => {
  beforeEach(() => {
    resetNonce();
  });

  test('creates a SetShape', () => {
    const valueShape = new Shape();

    const shape = new SetShape(valueShape);

    expect(shape.valueShape).toEqual(valueShape);
    expect(shape.inputs).toEqual([Type.SET]);
  });

  test('raises an issue if an input is not a Set', () => {
    const shape = new SetShape(new Shape());

    const result = shape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_SET, input: 'aaa', message: MESSAGE_TYPE_SET }],
    });
  });

  test('parses values in a Set', () => {
    const valueShape = new MockShape();

    const shape = new SetShape(valueShape);

    const input = new Set([111, 222]);

    const result = shape.try(input) as Ok;

    expect(result).toEqual({ ok: true, value: input });
    expect(result.value).toBe(input);
    expect(valueShape._apply).toHaveBeenCalledTimes(2);
    expect(valueShape._apply).toHaveBeenNthCalledWith(1, 111, { isEarlyReturn: false }, 0);
    expect(valueShape._apply).toHaveBeenNthCalledWith(2, 222, { isEarlyReturn: false }, 0);
  });

  test('raises a single issue captured by the value shape in an early-return mode', () => {
    const valueShape = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new SetShape(valueShape);

    expect(shape.try(new Set(['aaa', 'bbb']), { isEarlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('raises multiple issues captured by the value shape', () => {
    const valueShape = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new SetShape(valueShape);

    expect(shape.try(new Set(['aaa', 'bbb']))).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'xxx', path: [1] },
      ],
    });
  });

  test('returns a new set if some values were converted', () => {
    const cbMock = vi.fn().mockReturnValueOnce('aaa').mockReturnValueOnce('bbb');

    const valueShape = new Shape().convert(cbMock);

    const shape = new SetShape(valueShape);

    const input = new Set([111, 222]);

    const result = shape.try(input) as Ok;

    expect(input).toEqual(new Set([111, 222]));
    expect(result).toEqual({ ok: true, value: new Set(['aaa', 'bbb']) });
    expect(result.value).not.toBe(input);
  });

  test('applies operations', () => {
    const shape = new SetShape(new Shape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try(new Set([111]))).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns the value shape', () => {
      const valueShape = new Shape();

      const shape = new SetShape(valueShape);

      expect(shape.at('0')).toBe(valueShape);
      expect(shape.at(0)).toBe(valueShape);

      expect(shape.at('000')).toBeNull();
      expect(shape.at('1e+49')).toBeNull();
      expect(shape.at(-111)).toBeNull();
      expect(shape.at(111.222)).toBeNull();
      expect(shape.at('aaa')).toBeNull();
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new SetShape(new StringShape()).coerce().inputs).toEqual([Type.STRING, Type.SET, Type.OBJECT, Type.ARRAY]);
    });

    test('coerces a string value', () => {
      const shape = new SetShape(new Shape()).coerce();

      expect(shape.parse('aaa')).toEqual(new Set(['aaa']));
    });

    test('coerces a String object', () => {
      const shape = new SetShape(new Shape()).coerce();

      expect(shape.parse(new String('aaa'))).toEqual(new Set([new String('aaa')]));
    });

    test('coerces an array value', () => {
      const shape = new SetShape(new Shape()).coerce();

      expect(shape.parse(['aaa'])).toEqual(new Set(['aaa']));
    });

    test('coerces an array-like value', () => {
      const shape = new SetShape(new Shape()).coerce();

      expect(shape.parse({ 0: 'aaa', length: 1 })).toEqual(new Set(['aaa']));
    });
  });

  describe('deepPartial', () => {
    test('marks value as optional', () => {
      const shape = new SetShape(new StringShape()).deepPartial();

      expect(shape.parse(new Set(['aaa']))).toEqual(new Set(['aaa']));
      expect(shape.parse(new Set([undefined]))).toEqual(new Set([undefined]));
    });

    test('makes value deep partial', () => {
      const shape = new SetShape(new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      expect(shape.parse(new Set([{}]))).toEqual(new Set([{}]));
      expect(shape.parse(new Set([{ key1: undefined }]))).toEqual(new Set([{ key1: undefined }]));

      expect(shape.try(new Set([{ key1: 111 }]))).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_STRING,
            input: 111,
            message: MESSAGE_TYPE_STRING,
            path: [0, 'key1'],
          },
        ],
      });
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not a Set', async () => {
      const shape = new SetShape(new AsyncMockShape());

      const result = await shape.tryAsync('aaa');

      expect(result).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_SET, input: 'aaa', message: MESSAGE_TYPE_SET }],
      });
    });

    test('parses values in a Set', async () => {
      const valueShape = new AsyncMockShape();

      const shape = new SetShape(valueShape);

      const input = new Set([111, 222]);

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(valueShape._applyAsync).toHaveBeenCalledTimes(2);
      expect(valueShape._applyAsync).toHaveBeenNthCalledWith(1, 111, { isEarlyReturn: false }, 0);
      expect(valueShape._applyAsync).toHaveBeenNthCalledWith(2, 222, { isEarlyReturn: false }, 0);
    });

    test('does not apply value shape if the previous value raised an issue in an early-return mode', async () => {
      const cbMock = vi
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce([{ code: 'xxx' }]);

      const valueShape = new AsyncMockShape().check(cbMock);

      const shape = new SetShape(valueShape);

      const input = new Set([111, 222, 333]);

      await shape.tryAsync(input, { isEarlyReturn: true });

      expect(valueShape._applyAsync).toHaveBeenCalledTimes(2);
      expect(valueShape._applyAsync).toHaveBeenNthCalledWith(1, 111, { isEarlyReturn: true }, 0);
      expect(valueShape._applyAsync).toHaveBeenNthCalledWith(2, 222, { isEarlyReturn: true }, 0);
    });

    test('returns a new set if some values were converted', async () => {
      const cbMock = vi.fn();
      cbMock.mockReturnValueOnce(Promise.resolve('aaa'));
      cbMock.mockReturnValueOnce(Promise.resolve('bbb'));

      const valueShape = new Shape().convertAsync(cbMock);

      const shape = new SetShape(valueShape);

      const input = new Set([111, 222]);

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: new Set(['aaa', 'bbb']) });
      expect(result.value).not.toBe(input);
    });

    test('applies operations', async () => {
      const shape = new SetShape(new AsyncMockShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync(new Set([111]))).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow errors', async () => {
      const shape = new SetShape(
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        })
      );

      await expect(shape.tryAsync(new Set([111]))).rejects.toEqual(new Error('expected'));
    });

    describe('coerce', () => {
      test('coerces a non-array value', async () => {
        const shape = new SetShape(new AsyncMockShape()).coerce();

        await expect(shape.parseAsync('aaa')).resolves.toEqual(new Set(['aaa']));
      });

      test('coerces an array value', async () => {
        const shape = new SetShape(new AsyncMockShape()).coerce();

        await expect(shape.parseAsync(['aaa'])).resolves.toEqual(new Set(['aaa']));
      });
    });
  });
});
