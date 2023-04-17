import { ApplyOptions, DeepPartialProtocol, LazyShape, ObjectShape, Result, Shape, StringShape } from '../../main';
import { TYPE_OBJECT } from '../../main/Type';

describe('LazyShape', () => {
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

  test('parses values with an underlying shape', () => {
    const shape = new StringShape();
    const lazyShape = new LazyShape(() => shape);

    const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

    expect(lazyShape.isAsync).toBe(false);
    expect(lazyShape.parse('aaa')).toBe('aaa');
    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
  });

  test('applies checks to transformed value', () => {
    const checkMock = jest.fn(() => [{ code: 'xxx' }]);

    const shape = new StringShape().transform(parseFloat);
    const lazyShape = new LazyShape(() => shape).check(checkMock);

    expect(lazyShape.try('111')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
  });

  test('does not apply checks if an underlying shape raises an issue', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);
    const lazyShape = new LazyShape(() => shape).check(() => [{ code: 'yyy' }], { unsafe: true });

    expect(lazyShape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('_isAsync', () => {
    test('prevents short circuit', () => {
      const lazyShape: LazyShape<any> = new LazyShape(() => lazyShape);

      expect(lazyShape['_isAsync']()).toBe(false);
    });

    test('prevents infinite loop', () => {
      const lazyShape: LazyShape<any> = new LazyShape(() => new ObjectShape({ key1: lazyShape }, null));

      expect(lazyShape['_isAsync']()).toBe(false);
    });
  });

  describe('inputs', () => {
    test('prevents short circuit', () => {
      const lazyShape: LazyShape<any> = new LazyShape(() => lazyShape);

      expect(lazyShape.inputs).toEqual([]);
    });

    test('prevents infinite loop', () => {
      const lazyShape: LazyShape<any> = new LazyShape(() => new ObjectShape({ key1: lazyShape }, null));

      expect(lazyShape.inputs).toEqual([TYPE_OBJECT]);
    });
  });

  describe('deepPartial', () => {
    test('marks shape as deep partial', () => {
      class MockShape extends Shape implements DeepPartialProtocol<Shape> {
        deepPartial() {
          return deepPartialShape;
        }
      }

      const deepPartialShape = new MockShape();
      const shapeProviderMock = jest.fn(() => new MockShape());

      const shape = new LazyShape(shapeProviderMock).deepPartial();

      expect(shapeProviderMock).not.toHaveBeenCalled();

      expect(shape.shape).toBe(deepPartialShape);
      expect(shapeProviderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('async', () => {
    test('parses values with an underlying shape', async () => {
      const lazyShape = new LazyShape(() => asyncShape);

      const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

      expect(lazyShape.isAsync).toBe(true);
      await expect(lazyShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });
  });
});
