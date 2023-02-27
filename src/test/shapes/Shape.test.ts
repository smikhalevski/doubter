import {
  AnyShape,
  ConstShape,
  DenyLiteralShape,
  NumberShape,
  ObjectShape,
  PipeShape,
  ReplaceLiteralShape,
  Shape,
  StringShape,
  TransformShape,
  ValidationError,
} from '../../main';
import { CODE_DENIED, CODE_PREDICATE, MESSAGE_PREDICATE, TYPE_ANY, TYPE_STRING } from '../../main/constants';
import { CatchShape } from '../../main/shapes/Shape';

let asyncShape: AnyShape;

beforeEach(() => {
  asyncShape = new Shape().transformAsync(value => Promise.resolve(value));
});

describe('Shape', () => {
  test('creates a sync shape', () => {
    const shape = new Shape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputTypes).toEqual([TYPE_ANY]);
  });

  test('clones shape when check is added', () => {
    const cb = () => null;

    const shape1 = new Shape();
    const shape2 = shape1.check(cb);

    expect(shape1).not.toBe(shape2);
    expect(shape1.getCheck(cb)).toBe(undefined);
    expect(shape2.getCheck(cb)).toEqual({ key: cb, callback: cb, unsafe: false });
  });

  test('deletes a check', () => {
    const cbMock = jest.fn();

    const shape1 = new Shape().check(cbMock);
    const shape2 = shape1.deleteCheck(cbMock);

    shape2.parse(111);

    expect(shape1).not.toBe(shape2);
    expect(shape1.getCheck(cbMock)).not.toBe(undefined);
    expect(shape2.getCheck(cbMock)).toBe(undefined);
    expect(cbMock).not.toHaveBeenCalled();
  });

  test('invokes a check', () => {
    const cbMock = jest.fn(() => null);
    const shape = new Shape().check(cbMock);

    shape.parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
  });

  test('invokes checks in the same order they were added', () => {
    const cbMock = jest.fn(index => null);
    const shape = new Shape().check(() => cbMock(1)).check(() => cbMock(2));

    shape.parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(cbMock).toHaveBeenNthCalledWith(1, 1);
    expect(cbMock).toHaveBeenNthCalledWith(2, 2);
  });

  test('does not add the same check callback without a key', () => {
    const cbMock = jest.fn();
    const shape = new Shape().check(cbMock).check(cbMock);

    shape.parse(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
  });

  test('adds the same check callback with a key', () => {
    const cbMock = jest.fn();
    const shape = new Shape().check(cbMock, { key: 'aaa' }).check(cbMock);

    shape.parse(111);

    expect(cbMock).toHaveBeenCalledTimes(2);
  });

  test('replaces check callback with the same key', () => {
    const cbMock = jest.fn();
    const shape = new Shape().check(cbMock, { key: 'aaa' }).check(cbMock, { key: 'aaa' });

    shape.parse(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
  });

  test('returns ok when input was parsed', () => {
    expect(new Shape().try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('returns err when input parsing failed', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({ ok: false, issues: [{ code: 'xxx', path: [] }] });
  });

  test('returns ok if check returns an empty array', () => {
    const shape = new Shape().check(() => []);

    expect(shape.try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('returns value when input was parsed', () => {
    expect(new Shape().parse('aaa')).toEqual('aaa');
  });

  test('throw ValidationError when input parsing failed', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    expect(() => shape.parse('aaa')).toThrow(new ValidationError([{ code: 'xxx' }]));
  });

  test('checks can safely throw ValidationError instances', () => {
    const shape = new Shape().check(() => {
      throw new ValidationError([{ code: 'xxx' }]);
    });

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('does not swallow unrecognized errors', () => {
    const shape = new Shape().check(() => {
      throw new Error('expected');
    });

    expect(() => shape.try('aaa')).toThrow(new Error('expected'));
  });

  test('check is not called in verbose mode if preceding check failed', () => {
    const checkMock1 = jest.fn(() => [{ code: 'xxx' }]);
    const checkMock2 = jest.fn();

    const shape = new Shape().check(checkMock1).check(checkMock2);

    expect(shape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenCalledTimes(0);
  });

  test('unsafe checks are called in verbose mode even if preceding check failed', () => {
    const checkMock1 = jest.fn(() => [{ code: 'xxx' }]);
    const checkMock2 = jest.fn();

    const shape = new Shape().check(checkMock1).check(checkMock2, { unsafe: true });

    expect(shape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenNthCalledWith(1, 'aaa', { verbose: true });
  });

  test('collects all issues in verbose mode', () => {
    const checkMock1 = jest.fn(() => [{ code: 'xxx' }]);
    const checkMock2 = jest.fn(() => [{ code: 'yyy' }]);

    const shape = new Shape().check(checkMock1).check(checkMock2, { unsafe: true });

    expect(shape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [] },
        { code: 'yyy', path: [] },
      ],
    });

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenNthCalledWith(1, 'aaa', { verbose: true });
  });

  test('allows undefined input', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).optional();

    expect(shape.parse(undefined)).toBe(undefined);
  });

  test('result returned by optional can be safely mutated', () => {
    const shape = new Shape().optional('aaa');
    const result = shape.try(undefined);

    if (result.ok) {
      result.value = 'bbb';
    }

    expect(shape.parse(undefined)).toBe('aaa');
  });

  test('returns default value for an undefined input', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).optional('aaa');

    expect(shape.parse(undefined)).toBe('aaa');
  });

  test('allows null input', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullable();

    expect(shape.parse(null)).toBe(null);
  });

  test('replaces null with undefined', () => {
    const shape = new Shape().nullable(undefined);

    expect(shape.parse(null)).toBe(undefined);
  });

  test('returns default value for an null input', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullable('aaa');

    expect(shape.parse(null)).toBe('aaa');
  });

  test('allows null and undefined input', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish();

    expect(shape.parse(null)).toBe(null);
    expect(shape.parse(undefined)).toBe(undefined);
  });

  test('replaces null and undefined with undefined', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish(undefined);

    expect(shape.parse(null)).toBe(undefined);
    expect(shape.parse(undefined)).toBe(undefined);
  });

  test('replaces null and undefined with null', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish(null);

    expect(shape.parse(null)).toBe(null);
    expect(shape.parse(undefined)).toBe(null);
  });

  test('returns default value for both null and undefined inputs', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).nullish('aaa');

    expect(shape.parse(null)).toBe('aaa');
    expect(shape.parse(undefined)).toBe('aaa');
  });

  test('returns default if parsing failed', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    expect(shape.parseOrDefault(111, 222)).toBe(222);
  });

  test('transforms input', () => {
    expect(new Shape().transform(() => 222).parse(111)).toBe(222);
  });

  test('pipes input to another shape', () => {
    const shape = new Shape().transform(() => 222);

    expect(new Shape().to(shape).parse(111)).toBe(222);
  });

  test('returns the fallback value if parsing fails', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]).catch(222);

    expect(shape.parse(111)).toBe(222);
  });

  test('wraps in DenyLiteralShape', () => {
    const shape = new Shape().nonOptional();

    expect(shape).toBeInstanceOf(DenyLiteralShape);
    expect((shape as DenyLiteralShape<any, any>).deniedValue).toBe(undefined);
  });

  test('branding does not change shape identity', () => {
    const shape = new Shape();

    expect(shape.brand()).toBe(shape);
  });

  test('returns value type', () => {
    expect(Shape.typeOf([])).toBe('array');
    expect(Shape.typeOf(111)).toBe('number');
  });

  describe('refine', () => {
    test('invokes a predicate', () => {
      const cbMock = jest.fn(value => value === 'aaa');

      expect(new Shape().refine(cbMock).try('aaa')).toEqual({ ok: true, value: 'aaa' });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa');
    });

    test('does not invoke safe predicate if the preceding check failed', () => {
      const cbMock = jest.fn().mockReturnValue(false);

      const shape = new Shape().check(() => [{ code: 'xxx' }]).refine(cbMock);

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });

      expect(cbMock).toHaveBeenCalledTimes(0);
    });

    test('invokes an unsafe predicate', () => {
      const cbMock = jest.fn().mockReturnValue(false);

      const shape = new Shape().check(() => [{ code: 'xxx' }]).refine(cbMock, { unsafe: true });

      expect(shape.try('aaa', { verbose: true })).toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: [] },
          { code: CODE_PREDICATE, path: [], input: 'aaa', message: MESSAGE_PREDICATE, param: cbMock },
        ],
      });

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa');
    });

    test('returns issues if predicate fails', () => {
      const cb = () => false;

      expect(new Shape().refine(cb).try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, path: [], input: 'aaa', message: MESSAGE_PREDICATE, param: cb }],
      });
    });

    test('overrides refinement message as string', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, 'bbb');

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, path: [], input: 'aaa', message: 'bbb', param: cb }],
      });
    });

    test('overrides refinement message from options', () => {
      const cb = () => false;

      const shape = new Shape().refine(cb, { message: 'bbb' });

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_PREDICATE, path: [], input: 'aaa', message: 'bbb', param: cb }],
      });
    });
  });

  describe('async', () => {
    test('throws if sync methods are invoked', () => {
      expect(() => asyncShape.parse('')).toThrow(Error);
      expect(() => asyncShape.try('')).toThrow(Error);
    });

    test('returns promise', async () => {
      const outputPromise = asyncShape.parseAsync('aaa');
      const resultPromise = asyncShape.tryAsync('aaa');

      expect(outputPromise).toBeInstanceOf(Promise);
      expect(resultPromise).toBeInstanceOf(Promise);

      expect(await outputPromise).toBe('aaa');
      expect(await resultPromise).toEqual({ ok: true, value: 'aaa' });
    });

    test('returns default if parsing failed', async () => {
      const shape = new Shape().transformAsync(() => Promise.resolve()).check(() => [{ code: 'xxx' }]);

      await expect(shape.parseOrDefaultAsync(111, 222)).resolves.toBe(222);
    });
  });
});

describe('TransformShape', () => {
  test('transforms the output', () => {
    const cbMock = jest.fn(() => 111);

    const shape = new TransformShape(new Shape(), false, cbMock);

    expect(shape.parse('aaa')).toBe(111);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
  });

  test('does not call transform if shape parsing failed', () => {
    const cbMock = jest.fn(() => 111);

    const shape = new TransformShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      false,
      cbMock
    );

    shape.try('aaa');

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('transform callback can throw ValidationError instances', () => {
    const shape = new TransformShape(new Shape(), false, () => {
      throw new ValidationError([{ code: 'xxx' }]);
    });

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('does not swallow unrecognized errors', () => {
    const shape = new TransformShape(new Shape(), false, () => {
      throw new Error('expected');
    });

    expect(() => shape.try('aaa')).toThrow(new Error('expected'));
  });

  test('invokes a check', () => {
    const cbMock = jest.fn(() => null);
    const shape = new TransformShape(new Shape(), false, () => 111).check(cbMock);

    shape.parse('aaa');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
  });

  describe('async', () => {
    test('transforms async shape output', async () => {
      const cbMock = jest.fn(() => Promise.resolve(111));

      const shape = new TransformShape(new Shape(), true, cbMock);

      await expect(shape.parseAsync('aaa')).resolves.toBe(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('transforms using an async callback', async () => {
      const cbMock = jest.fn(() => Promise.resolve(111));

      const shape = new TransformShape(new Shape(), true, cbMock);

      await expect(shape.parseAsync('aaa')).resolves.toBe(111);

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('transform callback can reject with ValidationError instances', async () => {
      const shape = new TransformShape(new Shape(), true, () => Promise.reject(new ValidationError([{ code: 'xxx' }])));

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });

    test('does not swallow unrecognized errors', async () => {
      const shape = new TransformShape(new Shape(), true, () => Promise.reject('expected'));

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

    const pipeShape = new PipeShape(shape1, shape2);

    pipeShape.try('aaa');

    expect(applySpy).not.toHaveBeenCalled();
  });

  test('does not apply checks if the output shape has failed', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const checkMock = jest.fn();

    const pipeShape = new PipeShape(shape1, shape2).check(checkMock);

    pipeShape.try('aaa');

    expect(checkMock).not.toHaveBeenCalled();
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

  describe('async', () => {
    test('pipes the output of one shape to the other', async () => {
      const shape1 = asyncShape;
      const shape2 = new Shape();

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');

      const pipeShape = new PipeShape(shape1, shape2);

      await expect(pipeShape.parseAsync('aaa')).resolves.toBe('aaa');

      expect(applyAsyncSpy1).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });

      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy2).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('does not apply the output shape if the input shape parsing failed', async () => {
      const shape1 = asyncShape.check(() => [{ code: 'xxx' }]);
      const shape2 = asyncShape;

      const applySpy = jest.spyOn<Shape, any>(shape2, '_apply');

      const pipeShape = new PipeShape(shape1, shape2);

      await pipeShape.tryAsync('aaa');

      expect(applySpy).not.toHaveBeenCalled();
    });

    test('does not apply checks if the output shape has failed', async () => {
      const shape1 = asyncShape;
      const shape2 = asyncShape.check(() => [{ code: 'xxx' }]);

      const checkMock = jest.fn();

      const pipeShape = new PipeShape(shape1, shape2).check(checkMock);

      await pipeShape.tryAsync('aaa');

      expect(checkMock).not.toHaveBeenCalled();
    });
  });
});

describe('ReplaceLiteralShape', () => {
  test('replaces input value with an output', () => {
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
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('does not apply checks if shape raised issues', () => {
    const shape = new ReplaceLiteralShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      111,
      222
    ).check(() => [{ code: 'yyy' }], { unsafe: true });

    expect(shape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('applies checks to replaced value', () => {
    const checkMock = jest.fn();

    new ReplaceLiteralShape(new Shape(), 111, 222).check(checkMock).try(111);

    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 222, { coerced: false, verbose: false });
  });
});

describe('DenyLiteralShape', () => {
  test('returns input as is', () => {
    const shape = new DenyLiteralShape(new Shape(), undefined);

    expect(shape.try(111)).toEqual({ ok: true, value: 111 });
  });

  test('returns output as is', () => {
    const shape = new DenyLiteralShape(
      new Shape().transform(() => 222),
      undefined
    );

    expect(shape.try(111)).toEqual({ ok: true, value: 222 });
  });

  test('raises an issue if an input is undefined', () => {
    const shape = new DenyLiteralShape(new Shape(), undefined);

    expect(shape.try(undefined)).toEqual({
      ok: false,
      issues: [{ code: CODE_DENIED, message: 'Must not be equal to undefined', path: [] }],
    });
  });

  test('raises an issue if an output is undefined', () => {
    const shape = new DenyLiteralShape(
      new Shape().transform(() => undefined),
      undefined
    );

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_DENIED, message: 'Must not be equal to undefined', path: [], input: 111 }],
    });
  });

  test('does not apply checks if shape raises an issue', () => {
    const shape = new DenyLiteralShape(
      new Shape().check(() => [{ code: 'xxx' }]),
      undefined
    ).check(() => [{ code: 'yyy' }], { unsafe: true });

    expect(shape.try(111, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  describe('async', () => {
    test('returns input as is', async () => {
      const shape = new DenyLiteralShape(asyncShape, undefined);

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 111 });
    });

    test('returns output as is', async () => {
      const shape = new DenyLiteralShape(
        new Shape().transformAsync(() => Promise.resolve(222)),
        undefined
      );

      await expect(shape.tryAsync(111)).resolves.toEqual({ ok: true, value: 222 });
    });

    test('raises an issue if an input is undefined', async () => {
      const shape = new DenyLiteralShape(asyncShape, undefined);

      await expect(shape.tryAsync(undefined)).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_DENIED, message: 'Must not be equal to undefined', path: [] }],
      });
    });

    test('raises an issue if an output is undefined', async () => {
      const shape = new DenyLiteralShape(
        new Shape().transformAsync(() => Promise.resolve(undefined)),
        undefined
      );

      await expect(shape.tryAsync(111)).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_DENIED, message: 'Must not be equal to undefined', path: [], input: 111 }],
      });
    });
  });
});

describe('CatchShape', () => {
  test('returns the value of the underlying shape if parsing succeeds', () => {
    expect(new CatchShape(new StringShape(), 'aaa').parse('bbb')).toBe('bbb');
  });

  test('returns fallback value if parsing fails', () => {
    expect(new CatchShape(new StringShape(), 'aaa').parse(111)).toBe('aaa');
  });

  test('returns the result of a fallback callback if parsing fails', () => {
    expect(new CatchShape(new StringShape(), () => 'aaa').parse(111)).toBe('aaa');
  });

  test('returns input types of the underlying shape', () => {
    expect(new CatchShape(new StringShape(), 'aaa').inputTypes).toEqual([TYPE_STRING]);
  });

  test('returns input values of the underlying shape', () => {
    expect(new CatchShape(new ConstShape('aaa'), 'bbb')['_getInputValues']()).toEqual(['aaa']);
  });

  describe('async', () => {
    test('returns the value of the underlying shape if parsing succeeds', async () => {
      await expect(new CatchShape(new StringShape(), 'aaa').parseAsync('bbb')).resolves.toBe('bbb');
    });

    test('returns fallback value if parsing fails', async () => {
      await expect(new CatchShape(new StringShape(), 'aaa').parseAsync(111)).resolves.toBe('aaa');
    });

    test('returns the result of a fallback callback if parsing fails', async () => {
      await expect(new CatchShape(new StringShape(), () => 'aaa').parseAsync(111)).resolves.toBe('aaa');
    });
  });
});
