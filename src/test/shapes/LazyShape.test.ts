import { AnyShape, DeepPartialProtocol, LazyShape, ParseOptions, Result, Shape, StringShape } from '../../main';

describe('LazyShape', () => {
  let asyncShape: AnyShape;

  beforeEach(() => {
    asyncShape = new (class extends Shape {
      protected _isAsync(): boolean {
        return true;
      }

      protected _applyAsync(input: unknown, options: ParseOptions) {
        return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
      }
    })();
  });

  test('parses values with a shape', () => {
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
      issues: [{ code: 'xxx', path: [] }],
    });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
  });

  test('does not apply checks is shape raises an issue', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);
    const lazyShape = new LazyShape(() => shape).check({ unsafe: true }, () => [{ code: 'yyy' }]);

    expect(lazyShape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
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
    test('parses values with a shape', async () => {
      const lazyShape = new LazyShape(() => asyncShape);

      const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

      expect(lazyShape.isAsync).toBe(true);
      await expect(lazyShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });
  });
});
