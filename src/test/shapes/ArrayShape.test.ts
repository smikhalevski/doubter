import { ApplyResult, ArrayShape, ParseOptions, Shape } from '../../main';
import { CODE_ARRAY_MAX, CODE_ARRAY_MIN, CODE_TUPLE, CODE_TYPE, TYPE_ARRAY } from '../../main/constants';

class AsyncShape extends Shape {
  constructor() {
    super(true);
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult> {
    return Promise.resolve(null);
  }
}

describe('ArrayShape', () => {
  test('does not check array elements if there are no element shapes', () => {
    const shape = new ArrayShape(null, null);

    const arr = [1, 2];
    const result: any = shape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
  });

  test('parses tuple elements', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');

    const shape = new ArrayShape([shape1, shape2], null);

    const arr = [1, 2];
    const result: any = shape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy1).toHaveBeenNthCalledWith(1, 1, { verbose: false });
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenNthCalledWith(1, 2, { verbose: false });
  });

  test('parses rest elements', () => {
    const restShape = new Shape();

    const restApplySpy = jest.spyOn(restShape, 'apply');

    const shape = new ArrayShape(null, restShape);

    const arr = [1, 2];
    const result: any = shape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(restApplySpy).toHaveBeenCalledTimes(2);
    expect(restApplySpy).toHaveBeenNthCalledWith(1, 1, { verbose: false });
    expect(restApplySpy).toHaveBeenNthCalledWith(2, 2, { verbose: false });
  });

  test('parses tuple and rest elements', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();
    const restShape = new Shape();

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');
    const restApplySpy = jest.spyOn(restShape, 'apply');

    const shape = new ArrayShape([shape1, shape2], restShape);

    const arr = [1, 2, 3, 4];
    const result: any = shape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy1).toHaveBeenNthCalledWith(1, 1, { verbose: false });
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenNthCalledWith(1, 2, { verbose: false });
    expect(restApplySpy).toHaveBeenCalledTimes(2);
    expect(restApplySpy).toHaveBeenNthCalledWith(1, 3, { verbose: false });
    expect(restApplySpy).toHaveBeenNthCalledWith(2, 4, { verbose: false });
  });

  test('raises issue if tuple length is invalid', () => {
    const shape = new ArrayShape([new Shape(), new Shape()], null);

    expect(shape.try([0])).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: [0], message: 'Must be a tuple of length 2', param: 2, path: [] }],
    });
  });

  test('raises issue if passed value is not a tuple', () => {
    const shape = new ArrayShape([new Shape(), new Shape()], null);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2, path: [] }],
    });
  });

  test('raises issue if passed value is not an array', () => {
    const shape = new ArrayShape(null, new Shape());

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: 'Must be an array', param: TYPE_ARRAY, path: [] }],
    });
  });

  test('raises single issue with rest element', () => {
    const restShape = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new ArrayShape(null, restShape);

    expect(shape.try([0, 1])).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('raises multiple issues with rest elements in verbose mode', () => {
    const restShape = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new ArrayShape(null, restShape);

    expect(shape.try([0, 1], { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'xxx', path: [1] },
      ],
    });
  });

  test('raises multiple issues with tuple elements in verbose mode', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new ArrayShape([shape1, shape2], null);

    expect(shape.try([0, 1], { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'yyy', path: [1] },
      ],
    });
  });

  test('clones an array if element is changed', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().transform(() => 'aaa');

    const shape = new ArrayShape([shape1, shape2], null);

    const arr = [0, 1];
    const result: any = shape.try(arr);

    expect(result).toEqual({ ok: true, value: [0, 'aaa'] });
    expect(result.value).not.toBe(arr);
  });

  test('applies checks', () => {
    const shape = new ArrayShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try([0])).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('checks length', () => {
    const shape = new ArrayShape(null, new Shape()).length(2);

    expect(shape.try([0, 1])).toEqual({ ok: true, value: [0, 1] });
    expect(shape.try([0])).toEqual({ ok: false, issues: expect.any(Array) });
    expect(shape.try([0, 1, 2])).toEqual({ ok: false, issues: expect.any(Array) });
  });

  test('checks min length', () => {
    const shape = new ArrayShape(null, new Shape()).min(2);

    expect(shape.try([0, 1])).toEqual({ ok: true, value: [0, 1] });
    expect(shape.try([0])).toEqual({
      ok: false,
      issues: [{ code: CODE_ARRAY_MIN, path: [], input: [0], message: 'Must have the minimum length of 2', param: 2 }],
    });
  });

  test('checks max length', () => {
    const shape = new ArrayShape(null, new Shape()).max(2);

    expect(shape.try([0, 1])).toEqual({ ok: true, value: [0, 1] });
    expect(shape.try([0, 1, 2])).toEqual({
      ok: false,
      issues: [
        { code: CODE_ARRAY_MAX, path: [], input: [0, 1, 2], message: 'Must have the maximum length of 2', param: 2 },
      ],
    });
  });

  test('returns array element shape if only if key represents an integer', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const shape = new ArrayShape([shape1, shape2], null);

    expect(shape.at('0')).toBe(shape1);
    expect(shape.at('1')).toBe(shape2);
    expect(shape.at(-1)).toBe(null);
    expect(shape.at(0.5)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });

  test('returns tuple element shape', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const shape = new ArrayShape([shape1, shape2], null);

    expect(shape.at(0)).toBe(shape1);
    expect(shape.at(1)).toBe(shape2);
    expect(shape.at(2)).toBe(null);
  });

  test('returns rest element shape', () => {
    const restShape = new Shape();

    const shape = new ArrayShape(null, restShape);

    expect(shape.at(0)).toBe(restShape);
    expect(shape.at(1)).toBe(restShape);
  });

  test('returns rest element shape when tuple elements are available', () => {
    const shape1 = new Shape();
    const restShape = new Shape();

    const shape = new ArrayShape([shape1], restShape);

    expect(shape.at(0)).toBe(shape1);
    expect(shape.at(1)).toBe(restShape);
    expect(shape.at(2)).toBe(restShape);
  });

  describe('async', () => {
    test('delegates to sync implementation', async () => {
      const shape = new ArrayShape(null, new Shape());

      const applySpy = jest.spyOn(shape, 'apply');

      await expect(shape.tryAsync([])).resolves.toEqual({ ok: true, value: [] });
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, [], { verbose: false });
    });

    test('parses tuple elements', async () => {
      const shape1 = new Shape();
      const shape2 = new AsyncShape();

      const applyAsyncSpy1 = jest.spyOn(shape1, 'applyAsync');
      const applyAsyncSpy2 = jest.spyOn(shape2, 'applyAsync');

      const shape = new ArrayShape([shape1, shape2], null);

      const arr = [1, 2];
      const result: any = await shape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(applyAsyncSpy1).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy1).toHaveBeenNthCalledWith(1, 1, { verbose: false });
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy2).toHaveBeenNthCalledWith(1, 2, { verbose: false });
    });

    test('parses rest elements', async () => {
      const restShape = new AsyncShape();

      const restApplyAsyncSpy = jest.spyOn(restShape, 'applyAsync');

      const shape = new ArrayShape(null, restShape);

      const arr = [1, 2];
      const result: any = await shape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(restApplyAsyncSpy).toHaveBeenCalledTimes(2);
      expect(restApplyAsyncSpy).toHaveBeenNthCalledWith(1, 1, { verbose: false });
      expect(restApplyAsyncSpy).toHaveBeenNthCalledWith(2, 2, { verbose: false });
    });

    test('clones an array if element is changed', async () => {
      const shape1 = new Shape();
      const shape2 = new AsyncShape().transform(() => 'aaa');

      const shape = new ArrayShape([shape1, shape2], null);

      const arr = [0, 1];
      const result: any = await shape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: [0, 'aaa'] });
      expect(result.value).not.toBe(arr);
    });

    test('applies checks', async () => {
      const shape = new ArrayShape(null, new AsyncShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync([0])).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });
});
