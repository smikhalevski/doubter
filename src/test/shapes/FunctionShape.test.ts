import {
  AnyShape,
  ArrayShape,
  FunctionShape,
  NumberShape,
  ObjectShape,
  Shape,
  StringShape,
  ValidationError,
} from '../../main';
import { CODE_TYPE, CODE_TYPE_TUPLE } from '../../main/constants';
import { resetNonce } from '../../main/internal/shapes';
import { TYPE_FUNCTION, TYPE_NUMBER, TYPE_STRING } from '../../main/types';
import { AsyncMockShape, MockShape } from './mocks';

describe('FunctionShape', () => {
  let emptyArgsShape: AnyShape;

  beforeEach(() => {
    resetNonce();

    emptyArgsShape = new ArrayShape([], null);
  });

  test('creates a FunctionShape', () => {
    const shape = new FunctionShape(emptyArgsShape, null, null);

    expect(shape.isAsync).toBe(false);
    expect(shape.isStrict).toBe(false);
    expect(shape.isAsyncFunction).toBe(false);
    expect(shape.argsShape).toBe(emptyArgsShape);
    expect(shape.returnShape).toBeNull();
    expect(shape.thisShape).toBeNull();
    expect(shape.inputs).toEqual([TYPE_FUNCTION]);
  });

  test('does not ensure a function signature by default', () => {
    const input = () => null;

    const shape = new FunctionShape(emptyArgsShape, null, null);

    expect(shape.parse(input)).toBe(input);
  });

  describe('return', () => {
    test('adds a return shape', () => {
      const returnShape = new Shape();

      const shape1 = new FunctionShape(emptyArgsShape, null, null);
      const shape2 = shape1.return(returnShape);

      expect(shape2).not.toBe(shape1);
      expect(shape2.returnShape).toBe(returnShape);
    });
  });

  describe('this', () => {
    test('adds this value shape', () => {
      const thisShape = new Shape();

      const shape1 = new FunctionShape(emptyArgsShape, null, null);
      const shape2 = shape1.this(thisShape);

      expect(shape2).not.toBe(shape1);
      expect(shape2.thisShape).toBe(thisShape);
    });
  });

  describe('isAsyncFunction', () => {
    test('returns false if no argument shapes are async', () => {
      const argsShape = new ArrayShape([new MockShape()], null);

      expect(new FunctionShape(argsShape, null, null).isAsyncFunction).toBe(false);
    });

    test('returns true if any of the arguments is async', () => {
      const argsShape = new ArrayShape([new AsyncMockShape()], null);

      expect(new FunctionShape(argsShape, null, null).isAsyncFunction).toBe(true);
    });

    test('returns true if return shape is async', () => {
      expect(new FunctionShape(emptyArgsShape, new AsyncMockShape(), null).isAsyncFunction).toBe(true);
    });

    test('returns true if this shape is async', () => {
      expect(new FunctionShape(emptyArgsShape, null, new AsyncMockShape()).isAsyncFunction).toBe(true);
    });
  });

  describe('strict', () => {
    test('marks shape is strict', () => {
      const shape = new FunctionShape(emptyArgsShape, null, null);

      expect(shape.isStrict).toBe(false);
      expect(shape.strict().isStrict).toBe(true);
    });

    test('sets options', () => {
      const cbMock = jest.fn();

      new FunctionShape(emptyArgsShape.check(cbMock), null, null).strict({ earlyReturn: true }).ensure(() => null)();

      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, [], undefined, { earlyReturn: true });
    });

    test('ensures a function signature', () => {
      const input = () => null;
      const output = new FunctionShape(emptyArgsShape, null, null).strict().parse(input);

      expect(output).not.toBe(input);

      expect(() => output('aaa')).toThrow(
        new ValidationError([
          {
            code: CODE_TYPE_TUPLE,
            path: ['arguments'],
            input: ['aaa'],
            message: 'Must be a tuple of length 0',
            param: 0,
          },
        ])
      );
    });
  });

  describe('ensure', () => {
    test('handles a function with 0 arguments', () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(emptyArgsShape, null, null);

      shape.ensure(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('handles a function with 1 argument', () => {
      const fnMock = jest.fn();

      const argShape = new MockShape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      shape.ensure(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(argShape._apply).toHaveBeenCalledTimes(1);
      expect(argShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false }, 0);
    });

    test('raises an issue if this is invalid', () => {
      const shape = new FunctionShape(
        new ArrayShape([], null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      expect(() => shape.ensure(() => null).call({ key1: 111 } as any)).toThrow(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['this', 'key1'],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
        ])
      );
    });

    test('raises an issue if an argument is invalid in an early-return mode', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.ensure(() => null, { earlyReturn: true }).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['arguments', 0],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
        ])
      );
    });

    test('raises issues if arguments are invalid', () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      expect(() => shape.ensure(() => null).call(undefined, 111, 'aaa')).toThrow(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['arguments', 0],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
          {
            code: CODE_TYPE,
            path: ['arguments', 1],
            input: 'aaa',
            message: Shape.messages['type.number'],
            param: TYPE_NUMBER,
          },
        ])
      );
    });

    test('raises an issue if a return value is invalid', () => {
      const shape = new FunctionShape(new ArrayShape([], null), new StringShape(), null);

      expect(() => shape.ensure(() => 111 as any)()).toThrow(
        new ValidationError([
          { code: CODE_TYPE, path: ['return'], input: 111, message: Shape.messages['type.string'], param: TYPE_STRING },
        ])
      );
    });
  });

  describe('ensureAsync', () => {
    test('handles a function with 0 arguments', async () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(emptyArgsShape, null, null);

      await shape.ensureAsync(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('handles a function with 1 argument', async () => {
      const fnMock = jest.fn();

      const argShape = new MockShape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      await shape.ensureAsync(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(argShape._apply).toHaveBeenCalledTimes(1);
      expect(argShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false }, 0);
    });

    test('raises an issue if this is invalid', async () => {
      const shape = new FunctionShape(
        new ArrayShape([], null),
        null,
        new ObjectShape({ key1: new StringShape() }, null)
      );

      await expect(shape.ensureAsync(() => null).call({ key1: 111 } as any)).rejects.toEqual(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['this', 'key1'],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
        ])
      );
    });

    test('raises an issue if an argument is invalid in an early-return mode', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(shape.ensureAsync(() => null, { earlyReturn: true }).call(undefined, 111, 'aaa')).rejects.toEqual(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['arguments', 0],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
        ])
      );
    });

    test('raises issues if arguments are invalid', async () => {
      const shape = new FunctionShape(new ArrayShape([new StringShape(), new NumberShape()], null), null, null);

      await expect(shape.ensureAsync(() => null).call(undefined, 111, 'aaa')).rejects.toEqual(
        new ValidationError([
          {
            code: CODE_TYPE,
            path: ['arguments', 0],
            input: 111,
            message: Shape.messages['type.string'],
            param: TYPE_STRING,
          },
          {
            code: CODE_TYPE,
            path: ['arguments', 1],
            input: 'aaa',
            message: Shape.messages['type.number'],
            param: TYPE_NUMBER,
          },
        ])
      );
    });

    test('raises an issue if a return value is invalid', async () => {
      const shape = new FunctionShape(new ArrayShape([], null), new StringShape(), null);

      await expect(shape.ensureAsync(() => 111 as any)()).rejects.toEqual(
        new ValidationError([
          { code: CODE_TYPE, path: ['return'], input: 111, message: Shape.messages['type.string'], param: TYPE_STRING },
        ])
      );
    });
  });

  describe('async', () => {
    test('invokes async check', async () => {
      const checkMock = jest.fn(() => Promise.resolve([{ code: 'xxx' }]));

      const shape = new FunctionShape(new ArrayShape([], null), new StringShape(), null).checkAsync(checkMock);

      expect(shape.isAsync).toBe(true);

      await expect(shape.tryAsync(() => undefined)).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});
