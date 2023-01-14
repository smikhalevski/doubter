import { ArrayShape, Shape, StringShape } from '../../main';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TUPLE,
  CODE_TYPE,
  MESSAGE_ARRAY_TYPE,
  TYPE_ARRAY,
  TYPE_STRING,
} from '../../main/constants';

describe('ArrayShape', () => {
  test('creates an array shape', () => {
    const shape1 = new Shape();
    const restShape = new Shape();

    const arrShape = new ArrayShape([shape1], restShape);

    expect(arrShape.shapes).toEqual([shape1]);
    expect(arrShape.restShape).toBe(restShape);
    expect(arrShape['_getInputTypes']()).toEqual([TYPE_ARRAY]);
  });

  test('raises an issue if an input is not an unconstrained array', () => {
    const arrShape = new ArrayShape(null, null);

    const result = arrShape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY, path: [] }],
    });
  });

  test('does not check array elements if there are no tuple element shapes and no rest element shape', () => {
    const arrShape = new ArrayShape(null, null);

    const arr = [111, 222];
    const result: any = arrShape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
  });

  test('parses tuple elements', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');

    const arrShape = new ArrayShape([shape1, shape2], null);

    const arr = [111, 222];
    const result: any = arrShape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenNthCalledWith(1, 222, { verbose: false, coerced: false });
  });

  test('parses rest elements', () => {
    const restShape = new Shape();

    const restApplySpy = jest.spyOn<Shape, any>(restShape, '_apply');

    const arrShape = new ArrayShape(null, restShape);

    const arr = [111, 222];
    const result: any = arrShape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(restApplySpy).toHaveBeenCalledTimes(2);
    expect(restApplySpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    expect(restApplySpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
  });

  test('parses both tuple and rest elements at the same time', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();
    const restShape = new Shape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const restApplySpy = jest.spyOn<Shape, any>(restShape, '_apply');

    const arrShape = new ArrayShape([shape1, shape2], restShape);

    const arr = [111, 222, 333, 444];
    const result: any = arrShape.try(arr);

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenNthCalledWith(1, 222, { verbose: false, coerced: false });
    expect(restApplySpy).toHaveBeenCalledTimes(2);
    expect(restApplySpy).toHaveBeenNthCalledWith(1, 333, { verbose: false, coerced: false });
    expect(restApplySpy).toHaveBeenNthCalledWith(2, 444, { verbose: false, coerced: false });
  });

  test('raises an issue if the tuple length does not match shapes', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], null);

    expect(arrShape.try([111])).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: [111], message: 'Must be a tuple of length 2', param: 2, path: [] }],
    });
  });

  test('raises an issue if an input is not a tuple', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], null);

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2, path: [] }],
    });
  });

  test('raises an issue if an input is not an array', () => {
    const arrShape = new ArrayShape(null, new Shape());

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: 'Must be an array', param: TYPE_ARRAY, path: [] }],
    });
  });

  test('raises an issue if an input is too short for tuple with rest elements', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], new Shape());

    expect(arrShape.try(['aaa'])).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: ['aaa'], message: 'Must be an array', param: TYPE_ARRAY, path: [] }],
    });
  });

  test('raises a single issue captured by the rest shape', () => {
    const restShape = new Shape().check(() => [{ code: 'xxx' }]);

    const arrShape = new ArrayShape(null, restShape);

    expect(arrShape.try(['aaa', 'bbb'])).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('raises multiple issues captured by the rest shape in verbose mode', () => {
    const restShape = new Shape().check(() => [{ code: 'xxx' }]);

    const arrShape = new ArrayShape(null, restShape);

    expect(arrShape.try(['aaa', 'bbb'], { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'xxx', path: [1] },
      ],
    });
  });

  test('raises multiple issues captured by tuple shapes in verbose mode', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const arrShape = new ArrayShape([shape1, shape2], null);

    expect(arrShape.try(['aaa', 'bbb'], { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'yyy', path: [1] },
      ],
    });
  });

  test('clones an array if a tuple element was transformed', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().transform(() => 'aaa');

    const arrShape = new ArrayShape([shape1, shape2], null);

    const arr = [111, 222];
    const result: any = arrShape.try(arr);

    expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
    expect(result.value).not.toBe(arr);
  });

  test('applies checks', () => {
    const arrShape = new ArrayShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(arrShape.try([111])).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('checks length', () => {
    const arrShape = new ArrayShape(null, new Shape()).length(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111])).toEqual({ ok: false, issues: expect.any(Array) });
    expect(arrShape.try([111, 222, 333])).toEqual({ ok: false, issues: expect.any(Array) });
  });

  test('checks min length', () => {
    const arrShape = new ArrayShape(null, new Shape()).min(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111])).toEqual({
      ok: false,
      issues: [
        { code: CODE_ARRAY_MIN, path: [], input: [111], message: 'Must have the minimum length of 2', param: 2 },
      ],
    });
  });

  test('checks max length', () => {
    const arrShape = new ArrayShape(null, new Shape()).max(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111, 222, 333])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ARRAY_MAX,
          path: [],
          input: [111, 222, 333],
          message: 'Must have the maximum length of 2',
          param: 2,
        },
      ],
    });
  });

  test('returns the tuple element shape', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const arrShape = new ArrayShape([shape1, shape2], null);

    expect(arrShape.at('0')).toBe(shape1);
    expect(arrShape.at('1')).toBe(shape2);
    expect(arrShape.at('2')).toBe(null);

    expect(arrShape.at(0)).toBe(shape1);
    expect(arrShape.at(1)).toBe(shape2);
    expect(arrShape.at(2)).toBe(null);

    expect(arrShape.at('000')).toBe(null);
    expect(arrShape.at('1e+49')).toBe(null);
    expect(arrShape.at(-111)).toBe(null);
    expect(arrShape.at(111.222)).toBe(null);
    expect(arrShape.at('aaa')).toBe(null);
  });

  test('returns the rest element shape', () => {
    const restShape = new Shape();

    const arrShape = new ArrayShape(null, restShape);

    expect(arrShape.at(0)).toBe(restShape);
    expect(arrShape.at(1)).toBe(restShape);
  });

  test('returns the rest element shape when tuple element shapes are available', () => {
    const shape1 = new Shape();
    const restShape = new Shape();

    const arrShape = new ArrayShape([shape1], restShape);

    expect(arrShape.at(0)).toBe(shape1);
    expect(arrShape.at(1)).toBe(restShape);
    expect(arrShape.at(2)).toBe(restShape);
  });

  test('updates input types when coerced', () => {
    const arrShape = new ArrayShape([new StringShape()], null).coerce();

    expect(arrShape['_getInputTypes']()).toEqual([TYPE_STRING, TYPE_ARRAY]);
  });

  test('does not coerce if a tuple has no elements', () => {
    const arrShape = new ArrayShape([], null).coerce();

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 0', param: 0, path: [] }],
    });
  });

  test('coerces a non-array to a tuple of one element', () => {
    const arrShape = new ArrayShape([new Shape()], null).coerce();

    expect(arrShape.parse('aaa')).toEqual(['aaa']);
  });

  test('does not coerce if a tuple has more than one element', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], null).coerce();

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2, path: [] }],
    });
  });

  test('coerces a non-array to an array', () => {
    const arrShape = new ArrayShape(null, new Shape()).coerce();

    expect(arrShape.parse('aaa')).toEqual(['aaa']);
  });

  test('coerce if a tuple has no elements with rest elements', () => {
    const arrShape = new ArrayShape([], new Shape()).coerce();

    expect(arrShape.parse('aaa')).toEqual(['aaa']);
  });

  test('coerces a non-array to a tuple of one element with rest elements', () => {
    const arrShape = new ArrayShape([new Shape()], new Shape()).coerce();

    expect(arrShape.parse('aaa')).toEqual(['aaa']);
  });

  test('does not coerce if a tuple has more than one element with rest elements', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], new Shape()).coerce();

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY, path: [] }],
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not an unconstrained array', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const arrShape = new ArrayShape(null, restShape);

      const result = await arrShape.tryAsync('aaa');

      expect(result).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY, path: [] }],
      });
    });

    test('downgrades to sync implementation if there are no async element shapes', async () => {
      const arrShape = new ArrayShape(null, new Shape());

      const arrApplySpy = jest.spyOn<Shape, any>(arrShape, '_apply');

      await expect(arrShape.tryAsync([])).resolves.toEqual({ ok: true, value: [] });
      expect(arrApplySpy).toHaveBeenCalledTimes(1);
      expect(arrApplySpy).toHaveBeenNthCalledWith(1, [], { verbose: false, coerced: false });
    });

    test('parses tuple elements', async () => {
      const shape1 = new Shape();
      const shape2 = new Shape().transformAsync(value => Promise.resolve(value));

      shape1.async;
      shape2.async;

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');

      const arrShape = new ArrayShape([shape1, shape2], null);

      const arr = [111, 222];
      const result: any = await arrShape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(applyAsyncSpy1).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy2).toHaveBeenNthCalledWith(1, 222, { verbose: false, coerced: false });
    });

    test('parses rest elements', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const restApplyAsyncSpy = jest.spyOn<Shape, any>(restShape, '_applyAsync');

      const arrShape = new ArrayShape(null, restShape);

      const arr = [111, 222];
      const result: any = await arrShape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(restApplyAsyncSpy).toHaveBeenCalledTimes(2);
      expect(restApplyAsyncSpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(restApplyAsyncSpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
    });

    test('clones an array if a tuple element was transformed', async () => {
      const shape1 = new Shape();
      const shape2 = new Shape().transformAsync(() => Promise.resolve('aaa'));

      const arrShape = new ArrayShape([shape1, shape2], null);

      const arr = [111, 222];
      const result: any = await arrShape.tryAsync(arr);

      expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
      expect(result.value).not.toBe(arr);
    });

    test('applies checks', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const arrShape = new ArrayShape(null, restShape).check(() => [{ code: 'xxx' }]);

      await expect(arrShape.tryAsync([111])).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });

    test('coerces a non-array to an array', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const arrShape = new ArrayShape(null, restShape).coerce();

      await expect(arrShape.parseAsync('aaa')).resolves.toEqual(['aaa']);
    });

    test('coerces a non-array to a tuple of one element', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const arrShape = new ArrayShape([new Shape()], restShape).coerce();

      await expect(arrShape.parseAsync('aaa')).resolves.toEqual(['aaa']);
    });

    test('does not coerce if not a tuple of one element', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const arrShape = new ArrayShape([new Shape(), new Shape()], restShape).coerce();

      await expect(arrShape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY, path: [] }],
      });
    });
  });
});
