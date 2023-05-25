import {
  AnyShape,
  ApplyOptions,
  ArrayShape,
  FunctionShape,
  NumberShape,
  ObjectShape,
  Result,
  Shape,
  StringShape,
  ValidationError,
} from '../../main';
import { CODE_TUPLE, CODE_TYPE, MESSAGE_NUMBER_TYPE, MESSAGE_STRING_TYPE } from '../../main/constants';
import { TYPE_FUNCTION, TYPE_NUMBER, TYPE_STRING } from '../../main/Type';

describe('FunctionShape', () => {
  class AsyncShape extends Shape {
    protected _isAsync(): boolean {
      return true;
    }

    protected _applyAsync(input: unknown, options: ApplyOptions) {
      return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
    }
  }

  let arrayShape: AnyShape;
  let asyncShape: AsyncShape;

  beforeEach(() => {
    arrayShape = new ArrayShape([], null).length(0);
    asyncShape = new AsyncShape();
  });

  test('creates a FunctionShape', () => {
    const shape = new FunctionShape(arrayShape, null, null);

    expect(shape.isAsync).toBe(false);
    expect(shape.isAsyncSignature).toBe(false);
    expect(shape.argsShape).toBe(arrayShape);
    expect(shape.returnShape).toBeNull();
    expect(shape.thisShape).toBeNull();
    expect(shape.inputs).toEqual([TYPE_FUNCTION]);
  });

  test('does not wrap a function by default', () => {
    const fn = () => undefined;
    const wrapper = new FunctionShape(arrayShape, null, null).parse(fn);

    expect(wrapper).toBe(fn);
  });

  describe('return', () => {
    test('adds a return shape', () => {
      const returnShape = new Shape();
      const shape1 = new FunctionShape(arrayShape, null, null);

      const shape2 = shape1.return(returnShape);

      expect(shape2).not.toBe(shape1);
      expect(shape2.returnShape).toBe(returnShape);
    });
  });

  describe('this', () => {
    test('adds this value shape', () => {
      const thisShape = new Shape();
      const shape1 = new FunctionShape(arrayShape, null, null);

      const shape2 = shape1.this(thisShape);

      expect(shape2).not.toBe(shape1);
      expect(shape2.thisShape).toBe(thisShape);
    });
  });

  describe('isAsyncSignature', () => {
    test('wrapper is async if any of the arguments is async', () => {
      const argsShape = new ArrayShape([asyncShape], null);

      expect(new FunctionShape(argsShape, null, null).isAsyncSignature).toBe(true);
    });

    test('wrapper is async if return shape is async', () => {
      expect(new FunctionShape(arrayShape, asyncShape, null).isAsyncSignature).toBe(true);
    });

    test('wrapper is async if this shape is async', () => {
      expect(new FunctionShape(arrayShape, null, asyncShape).isAsyncSignature).toBe(true);
    });
  });

  describe('strict', () => {
    test('marks shape is strict', () => {
      const cbMock = jest.fn();

      const shape = new FunctionShape(arrayShape.check(cbMock), null, null);

      expect(shape.isStrict).toBe(false);
      expect(shape.strict().isStrict).toBe(true);
    });

    test('sets options used by the wrapper', () => {
      const cbMock = jest.fn();

      new FunctionShape(arrayShape.check(cbMock), null, null)
        .strict({ coerced: true })
        .ensureSignature(() => undefined)();

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, [], undefined, { coerced: true });
    });

    test('wraps a function', () => {
      const fn = () => undefined;
      const wrapper = new FunctionShape(arrayShape, null, null).strict().parse(fn);

      expect(wrapper).not.toBe(fn);

      expect(() => wrapper('aaa')).toThrow(
        new ValidationError([
          {
            code: CODE_TUPLE,
            path: ['arguments'],
            input: ['aaa'],
            message: 'Must be a tuple of length 0',
            param: 0,
          },
        ])
      );
    });
  });

  describe('ensureSignature', () => {
    test('wraps a function with 0 arguments', () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(arrayShape, null, null);

      shape.ensureSignature(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('wraps a function with 1 argument', () => {
      const fnMock = jest.fn();

      const argShape = new Shape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      const applySpy = jest.spyOn<Shape, any>(argShape, '_apply');

      shape.ensureSignature(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('raises an issue if this is invalid', () => {
      const shape = new FunctionShape(
        new ArrayShape([], null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      expect(() => shape.ensureSignature(() => undefined).call({ key1: 111 } as any)).toThrow(
        new ValidationError([
          { code: CODE_TYPE, path: ['this', 'key1'], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });

    test('raises an issue if an argument is invalid', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.ensureSignature(() => undefined).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          { code: CODE_TYPE, path: ['arguments', 0], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });

    test('raises issues if arguments are invalid in verbose mode', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.ensureSignature(() => undefined, { verbose: true }).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          { code: CODE_TYPE, path: ['arguments', 0], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
          { code: CODE_TYPE, path: ['arguments', 1], input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER },
        ])
      );
    });

    test('raises an issue if a return value is invalid', () => {
      const shape = new FunctionShape(new ArrayShape([], null), new StringShape(), null);

      expect(() => shape.ensureSignature(() => 111 as any)()).toThrow(
        new ValidationError([
          { code: CODE_TYPE, path: ['return'], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });
  });

  describe('ensureAsyncSignature', () => {
    test('wraps a function with 0 arguments', async () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(arrayShape, null, null);

      await shape.ensureAsyncSignature(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('wraps a function with 1 argument', async () => {
      const fnMock = jest.fn();

      const argShape = new Shape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      const applySpy = jest.spyOn<Shape, any>(argShape, '_apply');

      await shape.ensureAsyncSignature(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('raises an issue if this is invalid', async () => {
      const shape = new FunctionShape(
        new ArrayShape([], null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      await expect(shape.ensureAsyncSignature(() => undefined).call({ key1: 111 } as any)).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, path: ['this', 'key1'], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });

    test('raises an issue if an argument is invalid', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(shape.ensureAsyncSignature(() => undefined).call(undefined, 111, 'aaa')).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, path: ['arguments', 0], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });

    test('raises issues if arguments are invalid in verbose mode', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(
        shape.ensureAsyncSignature(() => undefined, { verbose: true }).call(undefined, 111, 'aaa')
      ).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, path: ['arguments', 0], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
          { code: CODE_TYPE, path: ['arguments', 1], input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER },
        ])
      );
    });

    test('raises an issue if a return value is invalid', async () => {
      const shape = new FunctionShape(new ArrayShape([], null), new StringShape(), null);

      await expect(shape.ensureAsyncSignature(() => 111 as any)()).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, path: ['return'], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING },
        ])
      );
    });
  });
});
