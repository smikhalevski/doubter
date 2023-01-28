import { DeepPartialProtocol, LazyShape, Shape, StringShape } from '../../main';

describe('LazyShape', () => {
  test('parses values with a shape', () => {
    const shape = new StringShape();
    const lazyShape = new LazyShape(() => shape);

    const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

    expect(lazyShape.async).toBe(false);
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
    expect(checkMock).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
  });

  describe('deepPartial', () => {
    test('marks shape as deep partial', () => {
      class MockShape extends Shape implements DeepPartialProtocol<Shape> {
        deepPartial() {
          return deepPartialShape;
        }
      }

      const deepPartialShape = new MockShape();

      expect(new LazyShape(() => new MockShape()).deepPartial()).toBe(deepPartialShape);
    });
  });

  describe('async', () => {
    class AsyncShape extends Shape {
      protected _requiresAsync() {
        return true;
      }

      protected _applyAsync() {
        return Promise.resolve(null);
      }
    }

    test('parses values with a shape', async () => {
      const shape = new AsyncShape();
      const lazyShape = new LazyShape(() => shape);

      const applyAsyncSpy = jest.spyOn<Shape, any>(shape, '_applyAsync');

      expect(lazyShape.async).toBe(true);
      await expect(lazyShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerced: false });
    });

    test('applies checks to transformed value', async () => {
      const checkMock = jest.fn(() => [{ code: 'xxx' }]);

      const shape = new AsyncShape().transform(parseFloat);
      const lazyShape = new LazyShape(() => shape).check(checkMock);

      await expect(lazyShape.tryAsync('111')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
      expect(checkMock).toHaveBeenCalledTimes(1);
      expect(checkMock).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    });
  });
});
