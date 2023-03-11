import {
  ApplyOptions,
  CatchShape,
  ConstShape,
  DenyLiteralShape,
  EnumShape,
  ExcludeShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  PipeShape,
  ReplaceLiteralShape,
  Shape,
  StringShape,
  TransformShape,
  ValidationError,
} from '../../main';
import {
  CODE_DENIED,
  CODE_EXCLUDED,
  CODE_PREDICATE,
  CODE_TYPE,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_EXCLUDED,
  MESSAGE_PREDICATE,
  MESSAGE_STRING_TYPE,
} from '../../main/constants';
import { Result } from '../../main/shapes/Shape';
import { ARRAY, NUMBER, STRING, UNKNOWN } from '../../main/utils';

class AsyncShape extends Shape {
  protected _isAsync(): boolean {
    return true;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions) {
    return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
  }
}

let asyncShape: AsyncShape;

beforeEach(() => {
  asyncShape = new AsyncShape();
});

describe('Shape', () => {
  test('creates a Shape', () => {
    const shape = new Shape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputTypes).toEqual([UNKNOWN]);
  });

  describe('typeOf', () => {
    test('returns value type', () => {
      expect(Shape.typeOf([])).toBe(ARRAY);
      expect(Shape.typeOf(111)).toBe(NUMBER);
    });
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

  describe('check', () => {
    test('clones the shape when check is added', () => {
      const cb = () => null;

      const shape1 = new Shape();
      const shape2 = shape1.check(cb);

      expect(shape1).not.toBe(shape2);
      expect(shape1.getCheck(cb)).toBeUndefined();
      expect(shape2.getCheck(cb)).toBeDefined();
    });

    test('adds a safe check by default', () => {
      const cb = () => null;
      expect(new Shape().check(cb).getCheck(cb)?.isUnsafe).toBe(false);
    });

    test('adds an unsafe check', () => {
      const cb = () => null;
      expect(new Shape().check({ unsafe: true }, cb).getCheck(cb)?.isUnsafe).toBe(true);
    });

    test('added check is applied', () => {
      const cbMock = jest.fn(() => null);
      const shape = new Shape().check(cbMock);

      shape.parse('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: false, coerced: false });
    });

    test('added parameterized check is applied', () => {
      const cbMock = jest.fn(() => null);
      const shape = new Shape().check(cbMock, 111);

      shape.parse('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', 111, { verbose: false, coerced: false });
    });

    test('applies checks in the same order they were added', () => {
      const cbMock = jest.fn();
      const shape = new Shape().check(() => cbMock(111)).check(() => cbMock(222));

      shape.parse('aaa');

      expect(cbMock).toHaveBeenCalledTimes(2);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111);
      expect(cbMock).toHaveBeenNthCalledWith(2, 222);
    });

    test('does not add the same check callback twice', () => {
      const cbMock = jest.fn();
      const shape = new Shape().check(cbMock).check(cbMock);

      shape.parse(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
    });

    test('does not add the same check callback twice if keys are equal', () => {
      const cbMock = jest.fn();
      const shape = new Shape().check({ key: 'aaa' }, cbMock).check({ key: 'aaa' }, cbMock);

      shape.parse(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
    });

    test('adds the same check callback twice if keys are different', () => {
      const cbMock = jest.fn();
      const shape = new Shape().check({ key: 'aaa' }, cbMock).check(cbMock);

      shape.parse(111);

      expect(cbMock).toHaveBeenCalledTimes(2);
    });

    test('replaces check callback with the same key', () => {
      const cbMock1 = jest.fn();
      const cbMock2 = jest.fn();
      const shape = new Shape().check({ key: 'aaa' }, cbMock1).check({ key: 'aaa' }, cbMock2);

      shape.parse(111);

      expect(cbMock1).not.toHaveBeenCalled();
      expect(cbMock2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCheck', () => {
    test('returns undefined if check not found', () => {
      expect(new Shape().getCheck(() => null)).toBeUndefined();
    });

    test('returns the check', () => {
      const cb = () => null;
      const shape = new Shape().check(cb);

      expect(shape.getCheck(cb)).toEqual({ key: cb, callback: cb, isUnsafe: false });
    });

    test('returns the check with custom key', () => {
      const cb = () => null;
      const shape = new Shape().check({ key: 'aaa' }, cb);

      expect(shape.getCheck('aaa')).toEqual({ key: 'aaa', callback: cb, isUnsafe: false });
    });
  });

  describe('hasCheck', () => {
    test('returns true if check was added', () => {
      const cb = () => null;

      expect(new Shape().hasCheck(cb)).toBe(false);
      expect(new Shape().check(cb).hasCheck(cb)).toBe(true);
    });
  });

  describe('deleteCheck', () => {
    test('clones the shape when check is deleted', () => {
      const cb = () => null;
      const shape = new Shape().check(cb);

      expect(shape.deleteCheck(cb)).not.toBe(shape);
    });

    test('deletes a check', () => {
      const cb = () => null;
      const shape = new Shape().check(cb);

      expect(shape.deleteCheck(cb).getCheck(cb)).toBeUndefined();
    });

    test('does not apply a deleted check', () => {
      const cbMock = jest.fn();

      new Shape().check(cbMock).deleteCheck(cbMock).parse(111);

      expect(cbMock).not.toHaveBeenCalled();
    });
  });

  describe('refine', () => {
    test('applies a predicate', () => {
      const cbMock = jest.fn(value => value === 'aaa');

      expect(new Shape().refine(cbMock).try('aaa')).toEqual({ ok: true, value: 'aaa' });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('does not apply a safe predicate if the preceding check failed', () => {
      const cbMock = jest.fn().mockReturnValue(false);

      const shape = new Shape().check(() => [{ code: 'xxx' }]).refine(cbMock);

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });

      expect(cbMock).toHaveBeenCalledTimes(0);
    });

    test('applies an unsafe predicate', () => {
      const cbMock = jest.fn().mockReturnValue(false);

      const shape = new Shape().check(() => [{ code: 'xxx' }]).refine(cbMock, { unsafe: true });

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }, { code: CODE_PREDICATE, input: 'aaa', message: MESSAGE_PREDICATE, param: cbMock }],
      });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: true });
    });

    test('returns issues if a predicate fails', () => {
      const cb = () => false;

      expect(new Shape().refine(cb).try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, input: 'aaa', message: MESSAGE_PREDICATE, param: cb }],
      });
    });

    test('overrides message as string', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, 'bbb');

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, input: 'aaa', message: 'bbb', param: cb }],
      });
    });

    test('overrides message from options', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, { message: 'bbb' });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, input: 'aaa', message: 'bbb', param: cb }],
      });
    });

    test('overrides issue meta', () => {
      const cb = () => false;

      expect(new Shape().refine(cb, { meta: 'aaa' }).try('bbb')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, input: 'bbb', message: MESSAGE_PREDICATE, meta: 'aaa', param: cb }],
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
  });

  describe('to', () => {
    test('returns a PipeShape', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const pipeShape = shape1.to(shape2);

      expect(pipeShape).toBeInstanceOf(PipeShape);
      expect(pipeShape.inputShape).toBe(shape1);
      expect(pipeShape.outputShape).toBe(shape2);
    });
  });

  describe('transform', () => {
    test('pipes the output to a sync TransformShape', () => {
      const shape = new Shape();
      const cb = () => 111;
      const pipeShape = shape.transform(cb);

      expect(pipeShape).toBeInstanceOf(PipeShape);
      expect((pipeShape as PipeShape<any, any>).inputShape).toBe(shape);
      expect((pipeShape as PipeShape<any, any>).outputShape).toBeInstanceOf(TransformShape);
      expect(((pipeShape as PipeShape<any, any>).outputShape as TransformShape<any>).callback).toBe(cb);
      expect(((pipeShape as PipeShape<any, any>).outputShape as TransformShape<any>).isAsync).toBe(false);
    });

    test('pipes from an async shape to TransformShape that synchronously returns a promise', async () => {
      const cbMock = jest.fn();

      const shape = asyncShape.transform(value => Promise.resolve('__' + value)).check(cbMock);

      const output = shape.parseAsync('aaa');

      await expect(output).resolves.toBe('__aaa');
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock.mock.calls[0][0]).toBeInstanceOf(Promise);
      await expect(cbMock.mock.calls[0][0]).resolves.toBe('__aaa');
    });
  });

  describe('transformAsync', () => {
    test('pipes the output to an async TransformShape', () => {
      const shape = new Shape();
      const cb = () => Promise.resolve(111);
      const pipeShape = shape.transformAsync(cb);

      expect(pipeShape).toBeInstanceOf(PipeShape);
      expect((pipeShape as PipeShape<any, any>).inputShape).toBe(shape);
      expect((pipeShape as PipeShape<any, any>).outputShape).toBeInstanceOf(TransformShape);
      expect(((pipeShape as PipeShape<any, any>).outputShape as TransformShape<any>).callback).toBe(cb);
      expect(((pipeShape as PipeShape<any, any>).outputShape as TransformShape<any>).isAsync).toBe(true);
    });
  });

  describe('brand', () => {
    test('branding does not change shape identity', () => {
      const shape = new Shape();

      expect(shape.brand()).toBe(shape);
    });
  });

  describe('replace', () => {
    test('returns a ReplaceLiteralShape', () => {
      const shape = new Shape();
      const replaceShape = shape.replace('aaa', 'bbb');

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBe('aaa');
      expect(replaceShape.outputValue).toBe('bbb');
    });
  });

  describe('allow', () => {
    test('returns a ReplaceLiteralShape', () => {
      const shape = new Shape();
      const replaceShape = shape.allow('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBe('aaa');
      expect(replaceShape.outputValue).toBe('aaa');
    });
  });

  describe('deny', () => {
    test('returns a DenyLiteralShape', () => {
      const shape = new Shape();
      const denyShape = shape.deny('aaa');

      expect(denyShape).toBeInstanceOf(DenyLiteralShape);
      expect(denyShape.shape).toBe(shape);
      expect(denyShape.deniedValue).toBe('aaa');
    });
  });

  describe('optional', () => {
    test('returns a ReplaceLiteralShape', () => {
      const shape = new Shape();
      const replaceShape = shape.optional();

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBeUndefined();
      expect(replaceShape.outputValue).toBeUndefined();
    });

    test('replaces undefined with the default value', () => {
      const shape = new Shape();
      const replaceShape = shape.optional('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBeUndefined();
      expect(replaceShape.outputValue).toBe('aaa');
    });

    test('returns default value for the undefined input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).optional('aaa');

      expect(shape.parse(undefined)).toBe('aaa');
    });
  });

  describe('nullable', () => {
    test('returns a ReplaceLiteralShape', () => {
      const shape = new Shape();
      const replaceShape = shape.nullable();

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBeNull();
      expect(replaceShape.outputValue).toBeNull();
    });

    test('replaces null with the default value', () => {
      const shape = new Shape();
      const replaceShape = shape.nullable('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBe(shape);
      expect(replaceShape.inputValue).toBeNull();
      expect(replaceShape.outputValue).toBe('aaa');
    });

    test('returns default value for the null input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).nullable('aaa');

      expect(shape.parse(null)).toBe('aaa');
    });
  });

  describe('nullish', () => {
    test('returns a ReplaceLiteralShape', () => {
      const shape = new Shape();
      const replaceShape = shape.nullish();

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.inputValue).toBeUndefined();
      expect(replaceShape.outputValue).toBeUndefined();

      expect(replaceShape.shape.shape).toBe(shape);
      expect(replaceShape.shape.inputValue).toBeNull();
      expect(replaceShape.shape.outputValue).toBeNull();
    });

    test('replaces null an undefined with the default value', () => {
      const shape = new Shape();
      const replaceShape = shape.nullish('aaa');

      expect(replaceShape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.shape).toBeInstanceOf(ReplaceLiteralShape);
      expect(replaceShape.inputValue).toBeUndefined();
      expect(replaceShape.outputValue).toBe('aaa');

      expect(replaceShape.shape.shape).toBe(shape);
      expect(replaceShape.shape.inputValue).toBeNull();
      expect(replaceShape.shape.outputValue).toBe('aaa');
    });

    test('returns default value for the null ot undefined input', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish('aaa');

      expect(shape.parse(null)).toBe('aaa');
      expect(shape.parse(undefined)).toBe('aaa');
    });
  });

  describe('nonOptional', () => {
    test('returns a DenyLiteralShape', () => {
      const shape = new Shape();
      const denyShape = shape.nonOptional();

      expect(denyShape).toBeInstanceOf(DenyLiteralShape);
      expect(denyShape.shape).toBe(shape);
      expect(denyShape.deniedValue).toBeUndefined();
    });
  });

  describe('catch', () => {
    test('returns a CatchShape', () => {
      const shape = new Shape();
      const catchShape = shape.catch();

      expect(catchShape).toBeInstanceOf(CatchShape);
      expect(catchShape.shape).toBe(shape);
      expect(catchShape.fallback).toBeUndefined();
    });

    test('returns a CatchShape with a fallback literal', () => {
      const shape = new Shape();
      const catchShape = shape.catch('aaa');

      expect(catchShape).toBeInstanceOf(CatchShape);
      expect(catchShape.shape).toBe(shape);
      expect(catchShape.fallback).toBe('aaa');
    });

    test('returns a CatchShape with a fallback callback', () => {
      const cb = () => 111;
      const shape = new Shape();
      const catchShape = shape.catch(cb);

      expect(catchShape).toBeInstanceOf(CatchShape);
      expect(catchShape.shape).toBe(shape);
      expect(catchShape.fallback).toBe(cb);
    });
  });

  describe('exclude', () => {
    test('returns an ExcludeShape', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const excludeShape = shape1.exclude(shape2);

      expect(excludeShape).toBeInstanceOf(ExcludeShape);
      expect(excludeShape.shape).toBe(shape1);
      expect(excludeShape.excludedShape).toBe(shape2);
    });
  });

  describe('not', () => {
    test('returns an ExcludeShape', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const excludeShape = shape1.not(shape2);

      expect(excludeShape).toBeInstanceOf(ExcludeShape);
      expect(excludeShape.shape).toBe(shape1);
      expect(excludeShape.excludedShape).toBe(shape2);
    });
  });

  describe('_isAsync', () => {
    test('provides value for isAsync', () => {
      class MockShape extends Shape {
        protected _isAsync(): boolean {
          return true;
        }
      }

      expect(new MockShape().isAsync).toBe(true);
    });
  });

  describe('_getInputTypes', () => {
    test('provides types for inputTypes', () => {
      class MockShape extends Shape {
        protected _getInputTypes() {
          return [STRING, STRING, NUMBER];
        }
      }

      expect(new MockShape().inputTypes).toEqual([STRING, NUMBER]);
    });
  });

  describe('try', () => {
    test('invokes _apply', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

      shape.try('aaa');

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('invokes _apply with options', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');
      const options = { coerced: true };

      shape.try('aaa', options);

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
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

    test('check is not called in verbose mode if preceding check failed', () => {
      const cbMock1 = jest.fn(() => [{ code: 'xxx' }]);
      const cbMock2 = jest.fn();

      const shape = new Shape().check(cbMock1).check(cbMock2);

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenCalledTimes(0);
    });

    test('unsafe checks are called in verbose mode even if preceding check failed', () => {
      const cbMock1 = jest.fn(() => [{ code: 'xxx' }]);
      const cbMock2 = jest.fn();

      const shape = new Shape().check(cbMock1).check({ unsafe: true }, cbMock2);

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: true });
    });

    test('collects all issues in verbose mode', () => {
      const cbMock1 = jest.fn(() => [{ code: 'xxx' }]);
      const cbMock2 = jest.fn(() => [{ code: 'yyy' }]);

      const shape = new Shape().check(cbMock1).check({ unsafe: true }, cbMock2);

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }, { code: 'yyy' }],
      });

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: true });
    });
  });

  describe('parse', () => {
    test('invokes _apply', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

      shape.parse('aaa');

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('invokes _apply with options', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');
      const options = { coerced: true };

      shape.parse('aaa', options);

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
    });

    test('returns a value when an input was parsed', () => {
      expect(new Shape().parse('aaa')).toEqual('aaa');
    });

    test('throws ValidationError when input parsing failed', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);

      expect(() => shape.parse('aaa')).toThrow(new ValidationError([{ code: 'xxx' }]));
    });

    test('uses string errorMessage option', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);

      expect(() => shape.parse(111, { errorMessage: 'aaa' })).toThrow(new ValidationError([{ code: 'xxx' }], 'aaa'));
    });

    test('invokes an errorMessage callback', () => {
      const shape = new Shape().check(() => [{ code: 'xxx' }]);
      const errorMessageMock = jest.fn(() => 'aaa');

      expect(() => shape.parse(111, { errorMessage: errorMessageMock })).toThrow(
        new ValidationError([{ code: 'xxx' }], 'aaa')
      );
      expect(errorMessageMock).toHaveBeenCalledTimes(1);
      expect(errorMessageMock).toHaveBeenNthCalledWith(1, [{ code: 'xxx' }], 111);
    });
  });

  describe('parseOrDefault', () => {
    test('invokes _apply', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

      shape.parseOrDefault('aaa');

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('invokes _apply with options', async () => {
      const shape = new Shape();
      const applySpy = jest.spyOn<Shape, any>(shape, '_apply');
      const options = { coerced: true };

      shape.parseOrDefault('aaa', 'bbb', options);

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
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
      expect(() => asyncShape.parse('')).toThrow(new Error(ERROR_REQUIRES_ASYNC));
      expect(() => asyncShape.try('')).toThrow(new Error(ERROR_REQUIRES_ASYNC));
    });

    describe('tryAsync', () => {
      test('invokes _applyAsync', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

        await asyncShape.tryAsync('aaa');

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
      });

      test('invokes _applyAsync with options', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');
        const options = { coerced: true };

        await asyncShape.tryAsync('aaa', options);

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
      });

      test('returns a Promise', async () => {
        await expect(asyncShape.tryAsync('aaa')).resolves.toEqual({ ok: true, value: 'aaa' });
      });
    });

    describe('parseAsync', () => {
      test('invokes _applyAsync', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

        await asyncShape.parseAsync('aaa');

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
      });

      test('invokes _applyAsync with options', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');
        const options = { coerced: true };

        await asyncShape.parseAsync('aaa', options);

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
      });

      test('returns a Promise', async () => {
        await expect(asyncShape.parseAsync('aaa')).resolves.toBe('aaa');
      });
    });

    describe('parseOrDefaultAsync', () => {
      test('invokes _applyAsync', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

        await asyncShape.parseOrDefaultAsync('aaa');

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
      });

      test('invokes _applyAsync with options', async () => {
        const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');
        const options = { coerced: true };

        await asyncShape.parseOrDefaultAsync('aaa', 'bbb', options);

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', options);
      });

      test('resolves with a default if parsing failed', async () => {
        const shape = new Shape().transformAsync(() => Promise.resolve()).check(() => [{ code: 'xxx' }]);

        await expect(shape.parseOrDefaultAsync(111, 222)).resolves.toBe(222);
      });
    });
  });
});

describe('TransformShape', () => {
  test('transforms a value', () => {
    const cbMock = jest.fn(() => 111);

    const shape = new TransformShape(cbMock);

    expect(shape.parse('aaa')).toBe(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
  });

  test('callback can throw a ValidationError', () => {
    const shape = new TransformShape(() => {
      throw new ValidationError([{ code: 'xxx' }]);
    });

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not swallow unrecognized errors', () => {
    const shape = new TransformShape(() => {
      throw new Error('expected');
    });

    expect(() => shape.try('aaa')).toThrow(new Error('expected'));
  });

  test('applies checks', () => {
    const cbMock = jest.fn(() => null);

    new TransformShape(() => 111).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
  });

  describe('async', () => {
    test('transforms using an async callback', async () => {
      const cbMock = jest.fn(() => Promise.resolve(111));

      const shape = new TransformShape(cbMock, true);

      await expect(shape.parseAsync('aaa')).resolves.toBe(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('transform callback can reject with ValidationError instances', async () => {
      const shape = new TransformShape(() => Promise.reject(new ValidationError([{ code: 'xxx' }])), true);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow unrecognized errors', async () => {
      const shape = new TransformShape(() => Promise.reject('expected'), true);

      await expect(shape.tryAsync('aaa')).rejects.toBe('expected');
    });
  });
});

describe('PipeShape', () => {
  test('pipes the output of one shape to the other', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');

    const pipeShape = new PipeShape(shape1, shape2);

    expect(pipeShape.parse('aaa')).toBe('aaa');

    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });

    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
  });

  test('does not apply the output shape if the input shape parsing failed', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape();

    const applySpy = jest.spyOn<Shape, any>(shape2, '_apply');

    new PipeShape(shape1, shape2).try('aaa');

    expect(applySpy).not.toHaveBeenCalled();
  });

  test('does not apply checks if the output shape has failed', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const cbMock = jest.fn();

    new PipeShape(shape1, shape2).check(cbMock).try('aaa');

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('applies checks', () => {
    const cbMock = jest.fn(() => null);

    new PipeShape(new Shape(), new Shape()).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: false, coerced: false });
  });

  describe('deepPartial', () => {
    test('pipes deep partial objects', () => {
      const shape1 = new ObjectShape({ key1: new StringShape().transform(parseFloat) }, null);
      const shape2 = new ObjectShape({ key1: new NumberShape() }, null);

      const pipeShape = new PipeShape(shape1, shape2).deepPartial();

      expect(pipeShape.parse({})).toEqual({});
      expect(pipeShape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(pipeShape.parse({ key1: '111' })).toEqual({ key1: 111 });
    });
  });

  describe('inputTypes', () => {
    test('returns input types of the input shape', () => {
      expect(new PipeShape(new StringShape(), new Shape()).inputTypes).toEqual([STRING]);
    });

    test('returns the input values of the input shape', () => {
      expect(new PipeShape(new ConstShape('aaa'), new Shape()).inputTypes).toEqual(['aaa']);
    });
  });

  describe('async', () => {
    test('pipes the output of one shape to the other', async () => {
      const shape1 = asyncShape;
      const shape2 = new Shape();

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');

      const pipeShape = new PipeShape(shape1, shape2);

      await expect(pipeShape.parseAsync('aaa')).resolves.toBe('aaa');

      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });

      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('does not apply the output shape if the input shape parsing failed', async () => {
      const shape1 = asyncShape.check(() => [{ code: 'xxx' }]);
      const shape2 = asyncShape;

      const applySpy = jest.spyOn<Shape, any>(shape2, '_applyAsync');

      await new PipeShape(shape1, shape2).tryAsync('aaa');

      expect(applySpy).not.toHaveBeenCalled();
    });

    test('does not apply checks if the output shape has failed', async () => {
      const shape1 = asyncShape;
      const shape2 = asyncShape.check(() => [{ code: 'xxx' }]);

      const cbMock = jest.fn();

      await new PipeShape(shape1, shape2).check(cbMock).tryAsync('aaa');

      expect(cbMock).not.toHaveBeenCalled();
    });

    test('applies checks', async () => {
      const cbMock = jest.fn(() => null);

      await new PipeShape(asyncShape, new Shape()).check(cbMock).parseAsync('aaa');

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: false, coerced: false });
    });
  });
});

describe('ReplaceLiteralShape', () => {
  test('replaces an input value value with an output value', () => {
    const shape = new ReplaceLiteralShape(new Shape(), 111, 222);

    expect(shape.parse('aaa')).toBe('aaa');
    expect(shape.parse(111)).toBe(222);
    expect(shape.parse(222)).toBe(222);
  });

  test('raises issues returned from the shape', () => {
    const shape = new ReplaceLiteralShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      111,
      222
    );

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not apply checks if the shape raised issues', () => {
    const shape = new ReplaceLiteralShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      111,
      222
    ).check({ unsafe: true }, () => [{ code: 'yyy' }]);

    expect(shape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('applies checks to the replaced value', () => {
    const cbMock = jest.fn();

    new ReplaceLiteralShape(new Shape(), 111, 222).check(cbMock).try(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 222, undefined, { coerced: false, verbose: false });
  });

  describe('inputTypes', () => {
    test('concatenates input types of the underlying shape and with the type of the replaced value', () => {
      expect(new ReplaceLiteralShape(new NumberShape(), 'aaa', 111).inputTypes).toEqual([NUMBER, 'aaa']);
    });

    test('erases never', () => {
      expect(new ReplaceLiteralShape(new NeverShape(), 'aaa', 111).inputTypes).toEqual(['aaa']);
    });

    test('returns discrete values', () => {
      expect(new ReplaceLiteralShape(new ConstShape('aaa'), 'bbb', 111).inputTypes).toEqual(['aaa', 'bbb']);
    });

    test('returns null if an underlying shape does not have discrete values', () => {
      expect(new ReplaceLiteralShape(new NumberShape(), 'aaa', 111).inputTypes).toEqual([NUMBER, 'aaa']);
    });
  });

  describe('async', () => {
    test('replaces an input value value with an output value', async () => {
      const shape = new ReplaceLiteralShape(asyncShape, 111, 222);

      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');
      await expect(shape.parseAsync(111)).resolves.toBe(222);
      await expect(shape.parseAsync(222)).resolves.toBe(222);
    });

    test('raises issues returned from the shape', async () => {
      const shape = new ReplaceLiteralShape(
        asyncShape.check(() => [{ code: 'xxx' }]),
        111,
        222
      );

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not apply checks if the shape raised issues', async () => {
      const shape = new ReplaceLiteralShape(
        asyncShape.check(() => [{ code: 'xxx' }]),
        111,
        222
      ).check({ unsafe: true }, () => [{ code: 'yyy' }]);

      await expect(shape.tryAsync('aaa', { verbose: true })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('applies checks to the replaced value', async () => {
      const cbMock = jest.fn();

      await new ReplaceLiteralShape(asyncShape, 111, 222).check(cbMock).tryAsync(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 222, undefined, { coerced: false, verbose: false });
    });
  });
});

describe('DenyLiteralShape', () => {
  test('returns input as is', () => {
    const shape = new DenyLiteralShape(new Shape(), 'aaa');

    expect(shape.try(111)).toEqual({ ok: true, value: 111 });
  });

  test('returns output as is', () => {
    const shape = new DenyLiteralShape(
      new Shape().transform(() => 222),
      'aaa'
    );

    expect(shape.try(111)).toEqual({ ok: true, value: 222 });
  });

  test('raises an issue if an input is denied', () => {
    const shape = new DenyLiteralShape(new Shape(), 111);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_DENIED, input: 111, message: 'Must not be equal to 111', param: 111 }],
    });
  });

  test('raises an issue if an output is denied', () => {
    const shape = new DenyLiteralShape(
      new Shape().transform(() => 111),
      111
    );

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_DENIED, input: 111, message: 'Must not be equal to 111', param: 111 }],
    });
  });

  test('applies checks', () => {
    const cbMock = jest.fn(() => null);

    new DenyLiteralShape(new Shape(), 111).check(cbMock).parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', undefined, { verbose: false, coerced: false });
  });

  test('does not apply checks if shape raises an issue', () => {
    const shape = new DenyLiteralShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      undefined
    ).check(() => [{ code: 'yyy' }], { unsafe: true });

    expect(shape.try(111, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputTypes', () => {
    test('returns input types of the underlying shape', () => {
      expect(new DenyLiteralShape(new StringShape(), 111).inputTypes).toEqual([STRING]);
    });

    test('preserves never', () => {
      expect(new DenyLiteralShape(new NeverShape(), 111).inputTypes).toEqual([]);
    });

    test('removes denied value from the array of discrete input values', () => {
      expect(new DenyLiteralShape(new EnumShape(['aaa', 'bbb']), 'bbb').inputTypes).toEqual(['aaa']);
    });

    test('returns null if an underlying shape does not have discrete values', () => {
      expect(new DenyLiteralShape(new NumberShape(), 111).inputTypes).toEqual([NUMBER]);
    });
  });

  describe('async', () => {
    test('returns input as is', async () => {
      const shape = new DenyLiteralShape(asyncShape, 'aaa');

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 111 });
    });

    test('returns output as is', async () => {
      const shape = new DenyLiteralShape(
        new Shape().transformAsync(() => Promise.resolve(222)),
        'aaa'
      );

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 222 });
    });

    test('raises an issue if an input is denied', async () => {
      const shape = new DenyLiteralShape(asyncShape, 111);

      await expect(shape.tryAsync(111)).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_DENIED, message: 'Must not be equal to 111', input: 111, param: 111 }],
      });
    });

    test('raises an issue if an output is denied', async () => {
      const shape = new DenyLiteralShape(
        new Shape().transformAsync(() => Promise.resolve(111)),
        111
      );

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_DENIED, input: 'aaa', message: 'Must not be equal to 111', param: 111 }],
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
    const fallbackMock = jest.fn();

    new CatchShape(new StringShape(), fallbackMock).parse(111);

    expect(fallbackMock).toHaveBeenCalledTimes(1);
    expect(fallbackMock).toHaveBeenNthCalledWith(
      1,
      111,
      [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: STRING }],
      { coerced: false, verbose: false }
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

  describe('inputTypes', () => {
    test('returns input types of the underlying shape', () => {
      expect(new CatchShape(new StringShape(), 'aaa').inputTypes).toEqual([STRING]);
    });

    test('returns input values of the underlying shape', () => {
      expect(new CatchShape(new ConstShape('aaa'), 'bbb').inputTypes).toEqual(['aaa']);
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
    const shape = new StringShape();

    const excludeShape = new ExcludeShape(
      new Shape().transform(() => 'aaa'),
      shape
    );

    expect(excludeShape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_EXCLUDED, input: 111, message: MESSAGE_EXCLUDED, param: shape }],
    });
  });

  test('applies checks', () => {
    const shape = new ExcludeShape(new Shape(), new StringShape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputTypes', () => {
    test('returns input types of the underlying shape', () => {
      expect(new ExcludeShape(new ConstShape('aaa'), new StringShape()).inputTypes).toEqual(['aaa']);
    });

    test('preserves never', () => {
      expect(new ExcludeShape(new NeverShape(), new StringShape()).inputTypes).toEqual([]);
    });

    test('removes the excluded value from the array of input values', () => {
      const shape = new ExcludeShape(new EnumShape(['aaa', 'bbb', 'ccc']), new EnumShape(['aaa', 'ccc']));

      expect(shape.inputTypes).toEqual(['bbb']);
    });

    test('returns null if the base shape does not have discrete values', () => {
      expect(new ExcludeShape(new NumberShape(), new ConstShape(111)).inputTypes).toEqual([NUMBER]);
    });

    test('returns base shape input values if the excluded shape does not have discrete values', () => {
      expect(new ExcludeShape(new ConstShape(111), new NumberShape()).inputTypes).toEqual([111]);
    });
  });

  describe('async', () => {
    test('returns the output as is if it is not excluded', async () => {
      await expect(new ExcludeShape(asyncShape, new StringShape()).parseAsync(222)).resolves.toBe(222);
    });

    test('does not apply exclusion if an underlying shape raised an issue', async () => {
      const shape = new ExcludeShape(
        asyncShape.check(() => [{ code: 'xxx' }]),
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
        issues: [{ code: CODE_EXCLUDED, input: 'aaa', message: MESSAGE_EXCLUDED, param: shape }],
      });
    });

    test('applies checks', async () => {
      const shape = new ExcludeShape(new Shape(), new StringShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync(111)).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});
