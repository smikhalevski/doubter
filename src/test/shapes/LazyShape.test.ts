import { LazyShape, Shape, StringShape } from '../../main';

describe('LazyShape', () => {
  test('parses values with a shape', () => {
    const shape = new StringShape();
    const lazyShape = new LazyShape(() => shape, false);

    const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

    expect(lazyShape.async).toBe(false);
    expect(lazyShape.parse('aaa')).toBe('aaa');
    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
  });

  test('applies checks to transformed value', () => {
    const checkMock = jest.fn(() => [{ code: 'xxx' }]);

    const shape = new StringShape().transform(parseFloat);
    const lazyShape = new LazyShape(() => shape, false).check(checkMock);

    expect(lazyShape.try('111')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 111, { verbose: false });
  });

  describe('async', () => {
    test('parses values with a shape', async () => {
      const shape = new StringShape();
      const lazyShape = new LazyShape(() => shape, true);

      const applyAsyncSpy = jest.spyOn<Shape, any>(shape, '_applyAsync');

      expect(lazyShape.async).toBe(true);
      await expect(lazyShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
    });

    test('applies checks to transformed value', async () => {
      const checkMock = jest.fn(() => [{ code: 'xxx' }]);

      const shape = new StringShape().transform(parseFloat);
      const lazyShape = new LazyShape(() => shape, true).check(checkMock);

      await expect(lazyShape.tryAsync('111')).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
      expect(checkMock).toHaveBeenCalledTimes(1);
      expect(checkMock).toHaveBeenNthCalledWith(1, 111, { verbose: false });
    });
  });
});
