import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CatchShape,
  ConstShape,
  ConvertShape,
  DenyShape,
  EnumShape,
  ExcludeShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  PipeShape,
  ReplaceShape,
  Shape,
  StringShape,
  ValidationError,
} from '../../main/index.js';
import {
  CODE_ANY_DENY,
  CODE_ANY_EXCLUDE,
  CODE_ANY_REFINE,
  CODE_TYPE_STRING,
  ERROR_SYNC_UNSUPPORTED,
  MESSAGE_ANY_EXCLUDE,
  MESSAGE_ANY_REFINE,
  MESSAGE_TYPE_STRING,
} from '../../main/constants.js';
import { resetNonce } from '../../main/internal/shapes.js';
import { Type } from '../../main/Type.js';
import { AsyncMockShape, MockShape } from './mocks.js';

beforeEach(() => {
  resetNonce();
});

describe('Shape', () => {
  test('creates a Shape', () => {
    const shape = new Shape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.UNKNOWN]);
  });

  describe('annotate', () => {
    test('updates annotations', () => {
      const shape1 = new Shape();
      const shape2 = new Shape().annotate({ key1: 111 });

      expect(shape1.annotations).toEqual({});
      expect(shape2).not.toBe(shape1);
      expect(shape2.annotations).toEqual({ key1: 111 });
      expect(shape2.annotate({ key2: 222 }).annotations).toEqual({ key1: 111, key2: 222 });
    });
  });

  describe('addOperation', () => {
    test('clones the shape', () => {
      const cb = () => null;

      const shape1 = new Shape();
      const shape2 = shape1.addOperation(cb, { type: 'aaa', param: 111 });

      expect(shape1).not.toBe(shape2);
      expect(shape1.operations.length).toBe(0);
      expect(shape2.operations).toEqual([
        {
          type: 'aaa',
          callback: cb,
          isAsync: false,
          tolerance: 'auto',
          param: 111,
        },
      ]);
    });

    test('adds a non-tolerant operation', () => {
      const cb = () => null;

      const shape = new Shape().addOperation(cb, { tolerance: 'abort' });

      expect(shape.operations).toEqual([
        {
          type: cb,
          callback: cb,
          isAsync: false,
          tolerance: 'abort',
        },
      ]);
    });

    test('operations are applied sequentially', () => {
      const cb1 = vi.fn().mockReturnValue({ ok: true, value: 'bbb' });
      const cb2 = vi.fn().mockReturnValue(null);

      const shape = new Shape().addOperation(cb1, { param: 111 }).addOperation(cb2, { param: 222 });

      shape.parse('aaa');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1).toHaveBeenNthCalledWith(1, 'aaa', 111, { isEarlyReturn: false });
      expect(cb2).toHaveBeenNthCalledWith(1, 'bbb', 222, { isEarlyReturn: false });
    });

    test('applies an operation even if the preceding operation has failed', () => {
      const cb1 = vi.fn().mockReturnValue([{ code: 'xxx' }]);
      const cb2 = vi.fn().mockReturnValue([{ code: 'yyy' }]);

      const shape = new Shape().addOperation(cb1).addOperation(cb2);

      expect(shape.try('aaa')).toEqual({
        issues: [{ code: 'xxx' }, { code: 'yyy' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    test('if a non-tolerant operation fails then consequent operations are skipped', () => {
      const cb1 = vi.fn().mockReturnValue([{ code: 'xxx' }]);
      const cb2 = vi.fn().mockReturnValue(null);

      const shape = new Shape().addOperation(cb1, { tolerance: 'abort' }).addOperation(cb2);

      expect(shape.try('aaa')).toEqual({
        issues: [{ code: 'xxx' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(0);
    });

    test('skips an operation if preceding operation has failed', () => {
      const cb1 = vi.fn().mockReturnValue([{ code: 'xxx' }]);
      const cb2 = vi.fn().mockReturnValue(null);
      const cb3 = vi.fn().mockReturnValue(null);

      const shape = new Shape().addOperation(cb1).addOperation(cb2, { tolerance: 'skip' }).addOperation(cb3);

      expect(shape.try('aaa')).toEqual({
        issues: [{ code: 'xxx' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(0);
      expect(cb3).toHaveBeenCalledTimes(1);
    });

    test('operation callback can safely throw ValidationError instances', () => {
      const shape = new Shape().addOperation(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('operation callback does not swallow thrown error', () => {
      const shape = new Shape().addOperation(() => {
        throw new Error('expected');
      });

      expect(() => shape.try(111)).toThrow(new Error('expected'));
    });
  });

  describe('addAsyncOperation', () => {
    test('clones the shape', () => {
      const cb = () => Promise.resolve(null);

      const shape1 = new Shape();
      const shape2 = shape1.addAsyncOperation(cb, { type: 'aaa', param: 111 });

      expect(shape1).not.toBe(shape2);
      expect(shape1.operations.length).toBe(0);
      expect(shape2.operations).toEqual([
        {
          type: 'aaa',
          callback: cb,
          isAsync: true,
          tolerance: 'auto',
          param: 111,
        },
      ]);
    });

    test('adds a non-tolerant operation', () => {
      const cb = () => Promise.resolve(null);

      const shape = new Shape().addAsyncOperation(cb, { tolerance: 'abort' });

      expect(shape.operations).toEqual([
        {
          type: cb,
          callback: cb,
          isAsync: true,
          tolerance: 'abort',
        },
      ]);
    });

    test('operations are applied sequentially', async () => {
      const cb1 = vi.fn().mockReturnValue(Promise.resolve({ ok: true, value: 'bbb' }));
      const cb2 = vi.fn().mockReturnValue(Promise.resolve(null));

      const shape = new Shape().addAsyncOperation(cb1, { param: 111 }).addAsyncOperation(cb2, { param: 222 });

      await shape.parseAsync('aaa');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1).toHaveBeenNthCalledWith(1, 'aaa', 111, { isEarlyReturn: false });
      expect(cb2).toHaveBeenNthCalledWith(1, 'bbb', 222, { isEarlyReturn: false });
    });

    test('applies an operation even if the preceding operation has failed', async () => {
      const cb1 = vi.fn().mockReturnValue(Promise.resolve([{ code: 'xxx' }]));
      const cb2 = vi.fn().mockReturnValue(Promise.resolve([{ code: 'yyy' }]));

      const shape = new Shape().addAsyncOperation(cb1).addAsyncOperation(cb2);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        issues: [{ code: 'xxx' }, { code: 'yyy' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    test('if a non-tolerant operation fails then consequent operations are skipped', async () => {
      const cb1 = vi.fn().mockReturnValue(Promise.resolve([{ code: 'xxx' }]));
      const cb2 = vi.fn().mockReturnValue(Promise.resolve(null));

      const shape = new Shape().addAsyncOperation(cb1, { tolerance: 'abort' }).addAsyncOperation(cb2);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        issues: [{ code: 'xxx' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(0);
    });

    test('skips an operation if preceding operation has failed', async () => {
      const cb1 = vi.fn().mockReturnValue(Promise.resolve([{ code: 'xxx' }]));
      const cb2 = vi.fn().mockReturnValue(Promise.resolve(null));
      const cb3 = vi.fn().mockReturnValue(Promise.resolve(null));

      const shape = new Shape()
        .addAsyncOperation(cb1)
        .addAsyncOperation(cb2, { tolerance: 'skip' })
        .addAsyncOperation(cb3);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        issues: [{ code: 'xxx' }],
        ok: false,
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(0);
      expect(cb3).toHaveBeenCalledTimes(1);
    });

    test('operation callback can safely throw ValidationError instances', async () => {
      const shape = new Shape().addAsyncOperation(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('operation callback can safely reject with ValidationError instances', async () => {
      const shape = new Shape().addAsyncOperation(() => Promise.reject(new ValidationError([{ code: 'xxx' }])));

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('operation callback does not swallow thrown error', async () => {
      const shape = new Shape().addAsyncOperation(() => {
        throw new Error('expected');
      });

      await expect(shape.tryAsync(111)).rejects.toEqual(new Error('expected'));
    });

    test('operation callback does not swallow rejected error', async () => {
      const shape = new Shape().addAsyncOperation(() => Promise.reject(new Error('expected')));

      await expect(shape.tryAsync(111)).rejects.toEqual(new Error('expected'));
    });

    test('sync and async operations can be mixed', async () => {
      const cb1 = vi.fn().mockReturnValue(Promise.resolve({ ok: true, value: 'aaa' }));
      const cb2 = vi.fn().mockReturnValue({ ok: true, value: 'bbb' });
      const cb3 = vi.fn().mockReturnValue(Promise.resolve({ ok: true, value: 'ccc' }));

      const shape = new Shape().addAsyncOperation(cb1).addAsyncOperation(cb2).addAsyncOperation(cb3);

      await expect(shape.parseAsync('ddd')).resolves.toBe('ccc');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb3).toHaveBeenCalledTimes(1);
      expect(cb1).toHaveBeenNthCalledWith(1, 'ddd', undefined, { isEarlyReturn: false });
      expect(cb2).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
      expect(cb3).toHaveBeenNthCalledWith(1, 'bbb', undefined, { isEarlyReturn: false });
    });
  });

  describe('check', () => {
    test('clones the shape when check is added', () => {
      const shape1 = new Shape();
      const shape2 = shape1.check(() => null);

      expect(shape1).not.toBe(shape2);
      expect(shape1.operations.length).toBe(0);
      expect(shape2.operations.length).toBe(1);
    });

    test('added callback is applied', () => {
      const cbMock = vi.fn(() => null);
      const shape = new Shape().check(cbMock);

      shape.parse('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
    });

    test('added parameterized callback is applied', () => {
      const cbMock = vi.fn(() => null);
      const shape = new Shape().check(cbMock, { param: 111 });

      shape.parse('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', 111, { isEarlyReturn: false });
    });

    test('uses callback as an operation type', () => {
      const cb = () => null;
      const shape = new Shape().check(cb);

      expect(shape.operations[0].type).toBe(cb);
    });

    test('overrides operation type', () => {
      const shape = new Shape().check(() => null, { type: 'aaa' });

      expect(shape.operations[0].type).toBe('aaa');
    });

    test('adds the param to the operation', () => {
      const shape = new Shape().check(() => null, { param: 111 });

      expect(shape.operations[0].param).toBe(111);
    });

    test('callback can return null', () => {
      const shape = new Shape().check(() => null);

      expect(shape.try(111)).toEqual({ ok: true, value: 111 });
    });

    test('callback can return undefined', () => {
      const shape = new Shape().check(() => null);

      expect(shape.try(111)).toEqual({ ok: true, value: 111 });
    });

    test('unexpected callback results are ignored', () => {
      const shape = new Shape().check(() => 222 as any);

      expect(shape.try(111)).toEqual({ ok: true, value: 111 });
    });

    test('callback can return an issue', () => {
      const shape = new Shape().check(() => ({ code: 'xxx' }));

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('callback can return a non-empty array of issues', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }, { code: 'yyy' }]);

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }, { code: 'yyy' }],
      });
    });

    test('callback can return an empty array of issues', () => {
      const shape = new Shape().check(() => []);

      expect(shape.try(111)).toEqual({ ok: true, value: 111 });
    });

    test('callback does not swallow thrown error', () => {
      const shape = new Shape().check(() => {
        throw new Error('expected');
      });

      expect(() => shape.try(111)).toThrow(new Error('expected'));
    });

    test('callback can throw an error with an empty array of issues', () => {
      const shape = new Shape().check(() => {
        throw new ValidationError([]);
      });

      expect(shape.try(111)).toEqual({ ok: false, issues: [] });
    });

    test('callback can throw an error with a non-empty array of issues', () => {
      const shape = new Shape().check(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });

  describe('refine', () => {
    test('applies a callback', () => {
      const cbMock = vi.fn(value => value === 'aaa');

      expect(new Shape().refine(cbMock).try('aaa')).toEqual({ ok: true, value: 'aaa' });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
    });

    test('uses callback as an operation type', () => {
      const cb = () => true;
      const shape = new Shape().refine(cb);

      expect(shape.operations[0].type).toBe(cb);
    });

    test('overrides operation type', () => {
      const shape = new Shape().refine(() => true, { type: 'aaa' });

      expect(shape.operations[0].type).toBe('aaa');
    });

    test('adds the param to the operation', () => {
      const shape = new Shape().refine(() => true, { param: 111 });

      expect(shape.operations[0].param).toBe(111);
    });

    test('returns issues if a predicate fails', () => {
      const cb = () => false;

      expect(new Shape().refine(cb).try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_REFINE, input: 'aaa', message: MESSAGE_ANY_REFINE, param: cb }],
      });
    });

    test('overrides message with a string', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, 'bbb');

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_REFINE, input: 'aaa', message: 'bbb', param: cb }],
      });
    });

    test('overrides message from options', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, { message: 'bbb' });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_REFINE, input: 'aaa', message: 'bbb', param: cb }],
      });
    });

    test('overrides issue meta', () => {
      const cb = () => false;

      expect(new Shape().refine(cb, { meta: 'aaa' }).try('bbb')).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_REFINE, input: 'bbb', message: MESSAGE_ANY_REFINE, meta: 'aaa', param: cb }],
      });
    });

    test('overrides issue code', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, { code: 'xxx' });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx', input: 'aaa', message: 'Must conform the predicate', param: cb }],
      });
    });

    test('adds the same callback twice', () => {
      const cbMock = vi.fn(() => true);
      const shape = new Shape().refine(cbMock).refine(cbMock);

      shape.parse(111);

      expect(cbMock).toHaveBeenCalledTimes(2);
    });

    test('callback can throw an error with an empty array of issues', () => {
      const shape = new Shape().refine(() => {
        throw new ValidationError([]);
      });

      expect(shape.try(111)).toEqual({ ok: false, issues: [] });
    });

    test('callback can throw an error with a non-empty array of issues', () => {
      const shape = new Shape().refine(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('delegates to the next operation if the preceding operation has failed', () => {
      const cbMock1 = () => false;
      const cbMock2 = vi.fn(() => true);
      const cbMock3 = vi.fn(() => true);

      const shape = new Shape().refine(cbMock1).refine(cbMock2).refine(cbMock3);

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_REFINE, input: 111, message: 'Must conform the predicate', param: cbMock1 }],
      });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock3).toHaveBeenCalledTimes(1);
    });
  });

  describe('alter', () => {
    test('applies a callback', () => {
      const cbMock = vi.fn(() => 111);

      expect(new Shape().alter(cbMock).try('aaa')).toEqual({ ok: true, value: 111 });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
    });

    test('adds the same callback twice', () => {
      const cbMock = vi.fn(value => value * 2);
      const shape = new Shape().alter(cbMock).alter(cbMock);

      expect(shape.parse(111)).toBe(444);
      expect(cbMock).toHaveBeenCalledTimes(2);
    });

    test('uses callback as an operation type', () => {
      const cb = () => 'aaa';
      const shape = new Shape().alter(cb);

      expect(shape.operations[0].type).toBe(cb);
    });

    test('overrides operation type', () => {
      const shape = new Shape().alter(() => 'aaa', { type: 'aaa' });

      expect(shape.operations[0].type).toBe('aaa');
    });

    test('adds the param to the operation', () => {
      const shape = new Shape().alter(() => 'aaa', { param: 111 });

      expect(shape.operations[0].param).toBe(111);
    });

    test('callback can throw an error with an empty array of issues', () => {
      const shape = new Shape().alter(() => {
        throw new ValidationError([]);
      });

      expect(shape.try(111)).toEqual({ ok: false, issues: [] });
    });

    test('callback can throw an error with a non-empty array of issues', () => {
      const shape = new Shape().alter(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      expect(shape.try(111)).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });

  describe('convert', () => {
    test('pipes the output to a sync ConvertShape', () => {
      const inputShape = new Shape();
      const cb = () => 111;
      const shape = inputShape.convert(cb);

      expect(shape).toBeInstanceOf(PipeShape);
      expect((shape as PipeShape<any, any>).inputShape).toBe(inputShape);
      expect((shape as PipeShape<any, any>).outputShape).toBeInstanceOf(ConvertShape);
      expect(((shape as PipeShape<any, any>).outputShape as ConvertShape<any>).converter).toBe(cb);
      expect(((shape as PipeShape<any, any>).outputShape as ConvertShape<any>).isAsync).toBe(false);
    });

    test('pipes from an async shape to ConvertShape that synchronously returns a promise', async () => {
      const cbMock = vi.fn();

      const shape = new AsyncMockShape().convert(value => Promise.resolve('__' + value)).check(cbMock);

      const output = shape.parseAsync('aaa');

      await expect(output).resolves.toBe('__aaa');
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock.mock.calls[0][0]).toBeInstanceOf(Promise);
      await expect(cbMock.mock.calls[0][0]).resolves.toBe('__aaa');
    });
  });

  describe('convertAsync', () => {
    test('pipes the output to an async ConvertShape', () => {
      const inputShape = new Shape();
      const cb = () => Promise.resolve(111);
      const shape = inputShape.convertAsync(cb);

      expect(shape).toBeInstanceOf(PipeShape);
      expect((shape as PipeShape<any, any>).inputShape).toBe(inputShape);
      expect((shape as PipeShape<any, any>).outputShape).toBeInstanceOf(ConvertShape);
      expect(((shape as PipeShape<any, any>).outputShape as ConvertShape<any>).converter).toBe(cb);
      expect(((shape as PipeShape<any, any>).outputShape as ConvertShape<any>).isAsync).toBe(true);
    });
  });

  describe('to', () => {
    test('returns a PipeShape', () => {
      const inputShape = new Shape();
      const outputShape = new Shape();
      const shape = inputShape.to(outputShape);

      expect(shape).toBeInstanceOf(PipeShape);
      expect(shape.inputShape).toBe(inputShape);
      expect(shape.outputShape).toBe(outputShape);
    });
  });

  describe('brand', () => {
    test('branding does not change shape identity', () => {
      const shape = new Shape();

      expect(shape.brand()).toBe(shape);
    });
  });

  describe('replace', () => {
    test('returns a ReplaceShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.replace('aaa', 'bbb');

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.inputValue).toBe('aaa');
      expect(shape.outputValue).toBe('bbb');
    });
  });

  describe('allow', () => {
    test('returns a ReplaceShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.allow('aaa');

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.inputValue).toBe('aaa');
      expect(shape.outputValue).toBe('aaa');
    });
  });

  describe('deny', () => {
    test('returns a DenyShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.deny('aaa');

      expect(shape).toBeInstanceOf(DenyShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.deniedValue).toBe('aaa');
    });
  });

  describe('optional', () => {
    test('returns a ReplaceShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.optional();

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.inputValue).toBeUndefined();
      expect(shape.outputValue).toBeUndefined();
    });

    test('replaces undefined with the default value', () => {
      const shape = new Shape();
      const replaceShape = shape.optional('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceShape);
      expect(replaceShape.baseShape).toBe(shape);
      expect(replaceShape.inputValue).toBeUndefined();
      expect(replaceShape.outputValue).toBe('aaa');
    });

    test('returns default value for the undefined input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).optional('aaa');

      expect(shape.parse(undefined)).toBe('aaa');
    });
  });

  describe('nullable', () => {
    test('returns a ReplaceShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.nullable();

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.inputValue).toBeNull();
      expect(shape.outputValue).toBeNull();
    });

    test('replaces null with the default value', () => {
      const shape = new Shape();
      const replaceShape = shape.nullable('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceShape);
      expect(replaceShape.baseShape).toBe(shape);
      expect(replaceShape.inputValue).toBeNull();
      expect(replaceShape.outputValue).toBe('aaa');
    });

    test('returns default value for the null input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).nullable('aaa');

      expect(shape.parse(null)).toBe('aaa');
    });
  });

  describe('nullish', () => {
    test('returns a ReplaceShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.nullish();

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBeInstanceOf(ReplaceShape);
      expect(shape.inputValue).toBeUndefined();
      expect(shape.outputValue).toBeUndefined();

      expect(shape.baseShape.baseShape).toBe(baseShape);
      expect(shape.baseShape.inputValue).toBeNull();
      expect(shape.baseShape.outputValue).toBeNull();
    });

    test('replaces null an undefined with the default value', () => {
      const baseShape = new Shape();
      const shape = baseShape.nullish('aaa');

      expect(shape).toBeInstanceOf(ReplaceShape);
      expect(shape.baseShape).toBeInstanceOf(ReplaceShape);
      expect(shape.inputValue).toBeUndefined();
      expect(shape.outputValue).toBe('aaa');

      expect(shape.baseShape.baseShape).toBe(baseShape);
      expect(shape.baseShape.inputValue).toBeNull();
      expect(shape.baseShape.outputValue).toBe('aaa');
    });

    test('returns default value for the null ot undefined input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish('aaa');

      expect(shape.parse(null)).toBe('aaa');
      expect(shape.parse(undefined)).toBe('aaa');
    });
  });

  describe('nonOptional', () => {
    test('returns a DenyShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.nonOptional();

      expect(shape).toBeInstanceOf(DenyShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.deniedValue).toBeUndefined();
    });
  });

  describe('catch', () => {
    test('returns a CatchShape', () => {
      const baseShape = new Shape();
      const shape = baseShape.catch();

      expect(shape).toBeInstanceOf(CatchShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.fallback).toBeUndefined();
    });

    test('returns a CatchShape with a fallback literal', () => {
      const baseShape = new Shape();
      const shape = baseShape.catch('aaa');

      expect(shape).toBeInstanceOf(CatchShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.fallback).toBe('aaa');
    });

    test('returns a CatchShape with a fallback callback', () => {
      const cb = () => 111;
      const baseShape = new Shape();
      const shape = baseShape.catch(cb);

      expect(shape).toBeInstanceOf(CatchShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.fallback).toBe(cb);
    });
  });

  describe('exclude', () => {
    test('returns an ExcludeShape', () => {
      const baseShape = new Shape();
      const excludedShape = new Shape();
      const shape = baseShape.exclude(excludedShape);

      expect(shape).toBeInstanceOf(ExcludeShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.excludedShape).toBe(excludedShape);
    });
  });

  describe('not', () => {
    test('returns an ExcludeShape', () => {
      const baseShape = new Shape();
      const excludedShape = new Shape();
      const shape = baseShape.not(excludedShape);

      expect(shape).toBeInstanceOf(ExcludeShape);
      expect(shape.baseShape).toBe(baseShape);
      expect(shape.excludedShape).toBe(excludedShape);
    });
  });

  describe('_isAsync', () => {
    test('provides value for isAsync', () => {
      class TestShape extends Shape {
        protected _isAsync(): boolean {
          return true;
        }
      }

      expect(new TestShape().isAsync).toBe(true);
    });
  });

  describe('_clone', () => {
    test('clones shape with enumerable properties', () => {
      class TestShape extends Shape {
        aaa = 111;
      }

      const shape1 = new TestShape();
      shape1.aaa = 222;

      const shape2 = shape1['_clone']();

      expect(shape2).not.toBe(shape1);
      expect(shape2).toBeInstanceOf(TestShape);
      expect(shape2.aaa).toBe(222);
    });
  });

  describe('inputs', () => {
    test('returns unique types', () => {
      class TestShape extends Shape {
        protected _getInputs() {
          return [Type.STRING, Type.STRING, Type.NUMBER];
        }
      }

      expect(new TestShape().inputs).toEqual([Type.STRING, Type.NUMBER]);
    });
  });

  describe('accepts', () => {
    test('returns true if shape accepts an input type', () => {
      class TestShape extends Shape {
        protected _getInputs() {
          return [Type.STRING];
        }
      }

      expect(new TestShape().accepts(Type.STRING)).toBe(true);
      expect(new TestShape().accepts(Type.NUMBER)).toBe(false);
      expect(new TestShape().accepts('aaa')).toBe(true);
      expect(new TestShape().accepts(111)).toBe(false);
    });

    test('returns true if shape accepts an literal value', () => {
      class TestShape extends Shape {
        protected _getInputs() {
          return ['aaa'];
        }
      }

      expect(new TestShape().accepts(Type.STRING)).toBe(false);
      expect(new TestShape().accepts(Type.NUMBER)).toBe(false);
      expect(new TestShape().accepts('aaa')).toBe(true);
      expect(new TestShape().accepts(111)).toBe(false);
    });

    test('returns true if shape accepts unknown type', () => {
      class TestShape extends Shape {
        protected _getInputs() {
          return [Type.UNKNOWN];
        }
      }

      expect(new TestShape().accepts(Type.STRING)).toBe(true);
      expect(new TestShape().accepts(Type.NUMBER)).toBe(true);
      expect(new TestShape().accepts('aaa')).toBe(true);
      expect(new TestShape().accepts(111)).toBe(true);
    });
  });

  describe('try', () => {
    test('invokes _apply', async () => {
      const shape = new MockShape();

      shape.try('aaa');

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
    });

    test('invokes _apply with options', async () => {
      const shape = new MockShape();
      const options = { isEarlyReturn: true };

      shape.try('aaa', options);

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', options, 0);
    });

    test('returns ok when an input was parsed', () => {
      expect(new Shape().try('aaa')).toEqual({ ok: true, value: 'aaa' });
    });

    test('returns Err when an input parsing failed', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('returns ok if check returns an empty array', () => {
      const shape = new Shape().check(() => []);

      expect(shape.try('aaa')).toEqual({ ok: true, value: 'aaa' });
    });

    test('checks can safely throw ValidationError instances', () => {
      const shape = new Shape().check(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow unrecognized errors', () => {
      const shape = new Shape().check(() => {
        throw new Error('expected');
      });

      expect(() => shape.try('aaa')).toThrow(new Error('expected'));
    });

    test('check is not called if the preceding non-tolerant operation has failed', () => {
      const cbMock1 = vi.fn(() => [{ code: 'xxx' }]);
      const cbMock2 = vi.fn();

      const shape = new Shape().check(cbMock1, { tolerance: 'abort' }).check(cbMock2);

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).not.toHaveBeenCalled();
    });

    test('collects all issues', () => {
      const cbMock1 = vi.fn(() => [{ code: 'xxx' }]);
      const cbMock2 = vi.fn(() => [{ code: 'yyy' }]);

      const shape = new Shape().check(cbMock1).check(cbMock2);

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }, { code: 'yyy' }],
      });

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
    });
  });

  describe('parse', () => {
    test('invokes _apply', async () => {
      const shape = new MockShape();

      shape.parse('aaa');

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
    });

    test('invokes _apply with options', async () => {
      const shape = new MockShape();
      const options = { isEarlyReturn: true };

      shape.parse('aaa', options);

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', options, 0);
    });

    test('returns a value when an input was parsed', () => {
      expect(new Shape().parse('aaa')).toEqual('aaa');
    });

    test('throws ValidationError when input parsing failed', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);

      expect(() => shape.parse('aaa')).toThrow(new ValidationError([{ code: 'xxx' }]));
    });
  });

  describe('parseOrDefault', () => {
    test('invokes _apply', async () => {
      const shape = new MockShape();

      shape.parseOrDefault('aaa');

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: true }, 0);
    });

    test('invokes _apply with options', async () => {
      const shape = new MockShape();

      shape.parseOrDefault('aaa', 'bbb', { context: 111 });

      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, 'aaa', { context: 111 }, 0);
    });

    test('returns a value when an input was parsed', () => {
      expect(new Shape().parseOrDefault('aaa')).toEqual('aaa');
    });

    test('returns a default value if parsing failed', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);

      expect(shape.parseOrDefault(111, 222)).toBe(222);
    });
  });

  describe('async', () => {
    test('throws if sync methods are invoked', () => {
      expect(() => new AsyncMockShape().parse('')).toThrow(new Error(ERROR_SYNC_UNSUPPORTED));
      expect(() => new AsyncMockShape().try('')).toThrow(new Error(ERROR_SYNC_UNSUPPORTED));
    });

    describe('tryAsync', () => {
      test('invokes _applyAsync', async () => {
        const shape = new AsyncMockShape();

        await shape.tryAsync('aaa');

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
      });

      test('invokes _applyAsync with options', async () => {
        const shape = new AsyncMockShape();

        const options = { isEarlyReturn: true };

        await shape.tryAsync('aaa', options);

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', options, 0);
      });

      test('returns a Promise', async () => {
        await expect(new AsyncMockShape().tryAsync('aaa')).resolves.toEqual({ ok: true, value: 'aaa' });
      });
    });

    describe('parseAsync', () => {
      test('invokes _applyAsync', async () => {
        const shape = new AsyncMockShape();

        await shape.parseAsync('aaa');

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
      });

      test('invokes _applyAsync with options', async () => {
        const shape = new AsyncMockShape();

        const options = { isEarlyReturn: true };

        await shape.parseAsync('aaa', options);

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', options, 0);
      });

      test('returns a Promise', async () => {
        await expect(new AsyncMockShape().parseAsync('aaa')).resolves.toBe('aaa');
      });
    });

    describe('parseOrDefaultAsync', () => {
      test('invokes _applyAsync', async () => {
        const shape = new AsyncMockShape();

        await shape.parseOrDefaultAsync('aaa');

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: true }, 0);
      });

      test('invokes _applyAsync with options', async () => {
        const shape = new AsyncMockShape();

        const options = { isEarlyReturn: true };

        await shape.parseOrDefaultAsync('aaa', 'bbb', options);

        expect(shape._applyAsync).toHaveBeenCalledTimes(1);
        expect(shape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', options, 0);
      });

      test('resolves with a default if parsing failed', async () => {
        const shape = new Shape().convertAsync(() => Promise.resolve()).check(() => [{ code: 'xxx' }]);

        await expect(shape.parseOrDefaultAsync(111, 222)).resolves.toBe(222);
      });
    });
  });
});

describe('ConvertShape', () => {
  test('converts a value', () => {
    const cbMock = vi.fn(() => 111);

    const shape = new ConvertShape(cbMock);

    expect(shape.parse('aaa')).toBe(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false });
  });

  test('callback can throw a ValidationError', () => {
    const shape = new ConvertShape(() => {
      throw new ValidationError([{ code: 'xxx' }]);
    });

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not swallow unrecognized errors', () => {
    const shape = new ConvertShape(() => {
      throw new Error('expected');
    });

    expect(() => shape.try('aaa')).toThrow(new Error('expected'));
  });

  test('applies operations', () => {
    const cbMock = vi.fn(() => null);

    new ConvertShape(() => 111).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { isEarlyReturn: false });
  });

  describe('async', () => {
    test('converts using an async callback', async () => {
      const cbMock = vi.fn(() => Promise.resolve(111));

      const shape = new ConvertShape(cbMock, true);

      await expect(shape.parseAsync('aaa')).resolves.toBe(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false });
    });

    test('convert callback can reject with ValidationError instances', async () => {
      const shape = new ConvertShape(() => Promise.reject(new ValidationError([{ code: 'xxx' }])), true);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow unrecognized errors', async () => {
      const shape = new ConvertShape(() => Promise.reject('expected'), true);

      await expect(shape.tryAsync('aaa')).rejects.toBe('expected');
    });
  });
});

describe('PipeShape', () => {
  test('pipes the output of one shape to the other', () => {
    const inputShape = new MockShape();
    const outputShape = new MockShape();

    const shape = new PipeShape(inputShape, outputShape);

    expect(shape.parse('aaa')).toBe('aaa');

    expect(inputShape._apply).toHaveBeenCalledTimes(1);
    expect(inputShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);

    expect(outputShape._apply).toHaveBeenCalledTimes(1);
    expect(outputShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
  });

  test('does not apply the output shape if the input shape parsing failed', () => {
    const inputShape = new MockShape().check(() => [{ code: 'xxx' }]);
    const outputShape = new MockShape();

    new PipeShape(inputShape, outputShape).try('aaa');

    expect(outputShape._apply).not.toHaveBeenCalled();
  });

  test('does not apply operations if the output shape has failed', () => {
    const inputShape = new Shape();
    const outputShape = new Shape().check(() => [{ code: 'xxx' }]);

    const cbMock = vi.fn();

    new PipeShape(inputShape, outputShape).check(cbMock).try('aaa');

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('applies operations', () => {
    const cbMock = vi.fn(() => null);

    new PipeShape(new Shape(), new Shape()).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
  });

  describe('deepPartial', () => {
    test('pipes deep partial objects', () => {
      const inputShape = new ObjectShape({ key1: new StringShape().convert(parseFloat) }, null);
      const outputShape = new ObjectShape({ key1: new NumberShape() }, null);

      const shape = new PipeShape(inputShape, outputShape).deepPartial();

      expect(shape.parse({})).toEqual({});
      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key1: '111' })).toEqual({ key1: 111 });
    });
  });

  describe('inputs', () => {
    test('returns inputs of the input shape', () => {
      expect(new PipeShape(new StringShape(), new Shape()).inputs).toEqual([Type.STRING]);
    });
  });

  describe('async', () => {
    test('pipes the output of one shape to the other', async () => {
      const inputShape = new AsyncMockShape();
      const outputShape = new MockShape();

      const shape = new PipeShape(inputShape, outputShape);

      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');

      expect(inputShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(inputShape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);

      expect(outputShape._apply).toHaveBeenCalledTimes(1);
      expect(outputShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { isEarlyReturn: false }, 0);
    });

    test('does not apply the output shape if the input shape parsing failed', async () => {
      const inputShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const outputShape = new AsyncMockShape();

      await new PipeShape(inputShape, outputShape).tryAsync('aaa');

      expect(outputShape._applyAsync).not.toHaveBeenCalled();
    });

    test('does not apply operations if the output shape has failed', async () => {
      const inputShape = new AsyncMockShape();
      const outputShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);

      const cbMock = vi.fn();

      await new PipeShape(inputShape, outputShape).check(cbMock).tryAsync('aaa');

      expect(cbMock).not.toHaveBeenCalled();
    });

    test('applies operations', async () => {
      const cbMock = vi.fn(() => null);

      await new PipeShape(new AsyncMockShape(), new Shape()).check(cbMock).parseAsync('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
    });
  });
});

describe('ReplaceShape', () => {
  test('replaces an input value value with an output value', () => {
    const shape = new ReplaceShape(new Shape(), 111, 222);

    expect(shape.parse('aaa')).toBe('aaa');
    expect(shape.parse(111)).toBe(222);
    expect(shape.parse(222)).toBe(222);
  });

  test('raises issues returned from the shape', () => {
    const shape = new ReplaceShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      111,
      222
    );

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not apply operations if the shape raised issues', () => {
    const shape = new ReplaceShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      111,
      222
    ).check(() => [{ code: 'yyy' }]);

    expect(shape.try('aaa', { isEarlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('applies operations to the replaced value', () => {
    const cbMock = vi.fn();

    new ReplaceShape(new Shape(), 111, 222).check(cbMock).try(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 222, undefined, { isEarlyReturn: false });
  });

  describe('inputs', () => {
    test('concatenates inputs of the underlying shape with the replaced value', () => {
      expect(new ReplaceShape(new NumberShape(), 'aaa', 111).inputs).toEqual([Type.NUMBER, 'aaa']);
    });

    test('erases never', () => {
      expect(new ReplaceShape(new NeverShape(), 'aaa', 111).inputs).toEqual(['aaa']);
    });
  });

  describe('async', () => {
    test('replaces an input value value with an output value', async () => {
      const shape = new ReplaceShape(new AsyncMockShape(), 111, 222);

      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');
      await expect(shape.parseAsync(111)).resolves.toBe(222);
      await expect(shape.parseAsync(222)).resolves.toBe(222);
    });

    test('raises issues returned from the shape', async () => {
      const shape = new ReplaceShape(
        new AsyncMockShape().check(() => [{ code: 'xxx' }]),
        111,
        222
      );

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not apply operations if the shape raised issues', async () => {
      const shape = new ReplaceShape(
        new AsyncMockShape().check(() => [{ code: 'xxx' }]),
        111,
        222
      ).check(() => [{ code: 'yyy' }]);

      await expect(shape.tryAsync('aaa', { isEarlyReturn: true })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('applies operations to the replaced value', async () => {
      const cbMock = vi.fn();

      await new ReplaceShape(new AsyncMockShape(), 111, 222).check(cbMock).tryAsync(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 222, undefined, { isEarlyReturn: false });
    });
  });
});

describe('DenyShape', () => {
  test('returns input as is', () => {
    const shape = new DenyShape(new Shape(), 'aaa');

    expect(shape.try(111)).toEqual({ ok: true, value: 111 });
  });

  test('returns output as is', () => {
    const shape = new DenyShape(
      new Shape().convert(() => 222),
      'aaa'
    );

    expect(shape.try(111)).toEqual({ ok: true, value: 222 });
  });

  test('raises an issue if an input is denied', () => {
    const shape = new DenyShape(new Shape(), 111);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_ANY_DENY, input: 111, message: 'Must not be equal to 111', param: 111 }],
    });
  });

  test('raises an issue if an output is denied', () => {
    const shape = new DenyShape(
      new Shape().convert(() => 111),
      111
    );

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_ANY_DENY, input: 111, message: 'Must not be equal to 111', param: 111 }],
    });
  });

  test('applies operations', () => {
    const cbMock = vi.fn(() => null);

    new DenyShape(new Shape(), 111).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { isEarlyReturn: false });
  });

  test('does not apply operations if shape raises an issue', () => {
    const shape = new DenyShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      undefined
    ).check(() => [{ code: 'yyy' }]);

    expect(shape.try(111, { isEarlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputs', () => {
    test('returns inputs of the underlying shape', () => {
      expect(new DenyShape(new StringShape(), 111).inputs).toEqual([Type.STRING]);
    });

    test('returns an empty array if an underlying shape is NeverShape', () => {
      expect(new DenyShape(new NeverShape(), 111).inputs).toEqual([]);
    });

    test('removes denied value from the array of discrete inputs', () => {
      expect(new DenyShape(new EnumShape(['aaa', 'bbb']), 'bbb').inputs).toEqual(['aaa']);
    });
  });

  describe('async', () => {
    test('returns input as is', async () => {
      const shape = new DenyShape(new AsyncMockShape(), 'aaa');

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 111 });
    });

    test('returns output as is', async () => {
      const shape = new DenyShape(
        new Shape().convertAsync(() => Promise.resolve(222)),
        'aaa'
      );

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 222 });
    });

    test('raises an issue if an input is denied', async () => {
      const shape = new DenyShape(new AsyncMockShape(), 111);

      await expect(shape.tryAsync(111)).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_DENY, message: 'Must not be equal to 111', input: 111, param: 111 }],
      });
    });

    test('raises an issue if an output is denied', async () => {
      const shape = new DenyShape(
        new Shape().convertAsync(() => Promise.resolve(111)),
        111
      );

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_DENY, input: 'aaa', message: 'Must not be equal to 111', param: 111 }],
      });
    });
  });
});

describe('CatchShape', () => {
  test('returns the value from the underlying shape if parsing succeeds', () => {
    expect(new CatchShape(new StringShape(), 'aaa').parse('bbb')).toBe('bbb');
  });

  test('returns a fallback value if parsing fails', () => {
    expect(new CatchShape(new StringShape(), 'aaa').parse(111)).toBe('aaa');
  });

  test('returns the result of a fallback callback if parsing fails', () => {
    expect(new CatchShape(new StringShape(), () => 'aaa').parse(111)).toBe('aaa');
  });

  test('fallback callback receives the input value, the array of issues, and parsing options', () => {
    const cbMock = vi.fn();

    new CatchShape(new StringShape(), cbMock).parse(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(
      1,
      111,
      [{ code: CODE_TYPE_STRING, input: 111, message: MESSAGE_TYPE_STRING }],
      { isEarlyReturn: false }
    );
  });

  test('an error thrown from fallback is not swallowed', () => {
    const shape = new CatchShape(new StringShape(), () => {
      throw new Error('expected');
    });

    expect(() => shape.parse(111)).toThrow(new Error('expected'));
  });

  test('ValidationError error thrown from fallback is returned as issues', () => {
    const shape = new CatchShape(new StringShape(), () => {
      throw new ValidationError([{ code: 'xxx' }]);
    });

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputs', () => {
    test('returns inputs of the underlying shape', () => {
      expect(new CatchShape(new StringShape(), 'aaa').inputs).toEqual([Type.STRING]);
    });

    test('returns inputs of the underlying shape', () => {
      expect(new CatchShape(new ConstShape('aaa'), 'bbb').inputs).toEqual(['aaa']);
    });
  });

  describe('async', () => {
    test('returns the value from the underlying shape if parsing succeeds', async () => {
      await expect(new CatchShape(new StringShape(), 'aaa').parseAsync('bbb')).resolves.toBe('bbb');
    });

    test('returns a fallback value if parsing fails', async () => {
      await expect(new CatchShape(new StringShape(), 'aaa').parseAsync(111)).resolves.toBe('aaa');
    });

    test('returns the result of a fallback callback if parsing fails', async () => {
      await expect(new CatchShape(new StringShape(), () => 'aaa').parseAsync(111)).resolves.toBe('aaa');
    });
  });
});

describe('ExcludeShape', () => {
  test('returns the output as is if it is not excluded', () => {
    expect(new ExcludeShape(new Shape(), new StringShape()).parse(222)).toBe(222);
  });

  test('does not apply exclusion if an underlying shape raised an issue', () => {
    const shape = new ExcludeShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      new StringShape()
    );

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('raises an issue if the output matches the excluded shape', () => {
    const excludedShape = new StringShape();

    const shape = new ExcludeShape(
      new Shape().convert(() => 'aaa'),
      excludedShape
    );

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_ANY_EXCLUDE, input: 111, message: MESSAGE_ANY_EXCLUDE, param: excludedShape }],
    });
  });

  test('applies operations', () => {
    const shape = new ExcludeShape(new Shape(), new StringShape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputs', () => {
    test('returns inputs of the underlying shape', () => {
      expect(new ExcludeShape(new ConstShape('aaa'), new StringShape()).inputs).toEqual(['aaa']);
    });

    test('returns an empty array when underlying shape is NeverShape', () => {
      expect(new ExcludeShape(new NeverShape(), new StringShape()).inputs).toEqual([]);
    });

    test('removes the excluded value from inputs', () => {
      const shape = new ExcludeShape(new EnumShape(['aaa', 'bbb', 'ccc']), new EnumShape(['aaa', 'ccc']));

      expect(shape.inputs).toEqual(['bbb']);
    });

    test('returns base shape inputs if the excluded shape does not have discrete values', () => {
      expect(new ExcludeShape(new ConstShape(111), new NumberShape()).inputs).toEqual([111]);
    });
  });

  describe('async', () => {
    test('returns the output as is if it is not excluded', async () => {
      await expect(new ExcludeShape(new AsyncMockShape(), new StringShape()).parseAsync(222)).resolves.toBe(222);
    });

    test('does not apply exclusion if an underlying shape raised an issue', async () => {
      const shape = new ExcludeShape(
        new AsyncMockShape().check(() => [{ code: 'xxx' }]),
        new StringShape()
      );

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('raises an issue if the output matches the excluded shape', async () => {
      const shape = new StringShape();

      await expect(new ExcludeShape(new Shape(), shape).tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_EXCLUDE, input: 'aaa', message: MESSAGE_ANY_EXCLUDE, param: shape }],
      });
    });

    test('applies operations', async () => {
      const shape = new ExcludeShape(new Shape(), new StringShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync(111)).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});
