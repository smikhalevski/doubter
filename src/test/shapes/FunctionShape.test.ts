import { AnyShape, ArrayShape, FunctionShape, Shape } from '../../main';
import { TYPE_FUNCTION } from '../../main/constants';

describe('FunctionShape', () => {
  let noArgsShape: AnyShape;
  let asyncShape: AnyShape;

  beforeEach(() => {
    noArgsShape = new ArrayShape(null, null);
    asyncShape = new Shape().transformAsync(value => Promise.resolve(value));
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

  test('decorator is async if any of the arguments is async', () => {
    const argsShape = new ArrayShape([asyncShape], null);

    expect(new FunctionShape(argsShape, null, null).isDecoratorAsync).toBe(true);
  });

  test('decorator is async if return shape is async', () => {
    expect(new FunctionShape(noArgsShape, asyncShape, null).isDecoratorAsync).toBe(true);
  });

  test('decorator is async if this shape is async', () => {
    expect(new FunctionShape(noArgsShape, null, asyncShape).isDecoratorAsync).toBe(true);
  });

  describe('decorate', () => {
    test('decorates a function with 0 arguments', () => {
      const fnMock = jest.fn();
      const shape = new FunctionShape(noArgsShape, null, null);

      shape.decorate(fnMock)();

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1);
    });

    test('decorates a function with 1 argument', () => {
      const fnMock = jest.fn();

      const argShape = new Shape();
      const shape = new FunctionShape(new ArrayShape([argShape], null), null, null);

      const parseSpy = jest.spyOn<Shape, any>(argShape, '_apply');

      shape.decorate(fnMock)('aaa');

      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(fnMock).toHaveBeenNthCalledWith(1, 'aaa');

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
    });
  });
});
