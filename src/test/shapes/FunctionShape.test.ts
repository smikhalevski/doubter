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
import {
  CODE_TYPE,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_STRING_TYPE,
  TYPE_FUNCTION,
  TYPE_NUMBER,
  TYPE_STRING,
} from '../../main/constants';

describe('FunctionShape', () => {
  let noArgsShape: AnyShape;
  let asyncShape: AnyShape;

  beforeEach(() => {
    noArgsShape = new ArrayShape(null, null);

    asyncShape = new (class extends Shape {
      protected _isAsync(): boolean {
        return true;
      }

      protected _applyAsync(input: unknown, options: ApplyOptions) {
        return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
      }
    })();
  });

  test('creates a string shape', () => {
    const shape = new FunctionShape(noArgsShape, null, null);

    expect(shape.isAsync).toBe(false);
    expect(shape.argsShape).toBe(noArgsShape);
    expect(shape.returnShape).toBe(null);
    expect(shape.thisShape).toBe(null);
    expect(shape.inputTypes).toEqual([TYPE_FUNCTION]);
  });

  test('adds a return shape', () => {
    const returnShape = new Shape();
    const shape1 = new FunctionShape(noArgsShape, null, null);

    const shape2 = shape1.return(returnShape);

    expect(shape2).not.toBe(shape1);
    expect(shape2.returnShape).toBe(returnShape);
  });

  test('adds this value shape', () => {
    const thisShape = new Shape();
    const shape1 = new FunctionShape(noArgsShape, null, null);

    const shape2 = shape1.this(thisShape);

    expect(shape2).not.toBe(shape1);
    expect(shape2.thisShape).toBe(thisShape);
  });

  test('delegator is async if any of the arguments is async', () => {
    const argsShape = new ArrayShape([asyncShape], null);

    expect(new FunctionShape(argsShape, null, null).isDelegatorAsync).toBe(true);
  });

  test('delegator is async if return shape is async', () => {
    expect(new FunctionShape(noArgsShape, asyncShape, null).isDelegatorAsync).toBe(true);
  });

  test('delegator is async if this shape is async', () => {
    expect(new FunctionShape(noArgsShape, null, asyncShape).isDelegatorAsync).toBe(true);
  });

  test('bare prevents a function from being wrapped', () => {
    const fnStub = () => undefined;

    expect(new FunctionShape(noArgsShape, null, null).bare().parse(fnStub)).toBe(fnStub);
  });

  describe('delegate', () => {
    test('delegates a function with 0 arguments', () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(noArgsShape, null, null);

      shape.delegate(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('delegates a function with 1 argument', () => {
      const fnMock = jest.fn();

      const argShape = new Shape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      const parseSpy = jest.spyOn<Shape, any>(argShape, '_apply');

      shape.delegate(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('raises an issue if this is invalid', () => {
      const shape = new FunctionShape(
        new ArrayShape(null, null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      expect(() => shape.delegate(() => undefined).call({ key1: 111 } as any)).toThrow(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['this', 'key1'] },
        ])
      );
    });

    test('raises an issue if an argument is invalid', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.delegate(() => undefined).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['arguments', 0] },
        ])
      );
    });

    test('raises issues if arguments are invalid in verbose mode', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.delegate(() => undefined, { verbose: true }).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['arguments', 0] },
          { code: CODE_TYPE, message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, input: 'aaa', path: ['arguments', 1] },
        ])
      );
    });

    test('raises an issue if a return value is invalid', () => {
      const shape = new FunctionShape(new ArrayShape(null, null), new StringShape(), null);

      expect(() => shape.delegate(() => 111 as any)()).toThrow(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['return'] },
        ])
      );
    });
  });

  describe('delegateAsync', () => {
    test('delegates a function with 0 arguments', async () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(noArgsShape, null, null);

      await shape.delegateAsync(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('delegates a function with 1 argument', async () => {
      const fnMock = jest.fn();

      const argShape = new Shape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      const parseSpy = jest.spyOn<Shape, any>(argShape, '_apply');

      await shape.delegateAsync(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });

    test('raises an issue if this is invalid', async () => {
      const shape = new FunctionShape(
        new ArrayShape(null, null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      await expect(shape.delegateAsync(() => undefined).call({ key1: 111 } as any)).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['this', 'key1'] },
        ])
      );
    });

    test('raises an issue if an argument is invalid', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(shape.delegateAsync(() => undefined).call(undefined, 111, 'aaa')).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['arguments', 0] },
        ])
      );
    });

    test('raises issues if arguments are invalid in verbose mode', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(shape.delegateAsync(() => undefined, { verbose: true }).call(undefined, 111, 'aaa')).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['arguments', 0] },
          { code: CODE_TYPE, message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, input: 'aaa', path: ['arguments', 1] },
        ])
      );
    });

    test('raises an issue if a return value is invalid', async () => {
      const shape = new FunctionShape(new ArrayShape(null, null), new StringShape(), null);

      await expect(shape.delegateAsync(() => 111 as any)()).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, input: 111, path: ['return'] },
        ])
      );
    });
  });
});
