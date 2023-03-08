import { ApplyOptions, ArrayShape, Err, NumberShape, ObjectShape, Ok, Result, Shape, StringShape } from '../../main';
import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TUPLE,
  CODE_TYPE,
  MESSAGE_ARRAY_TYPE,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_STRING_TYPE,
  TYPE_UNKNOWN,
  TYPE_ARRAY,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../../main/constants';

describe('ArrayShape', () => {
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

  test('creates an ArrayShape', () => {
    const shape1 = new Shape();
    const restShape = new Shape();

    const arrShape = new ArrayShape([shape1], restShape);

    expect(arrShape.shapes).toEqual([shape1]);
    expect(arrShape.restShape).toBe(restShape);
    expect(arrShape.inputTypes).toEqual([TYPE_ARRAY]);
  });

  test('raises an issue if an input is not an unconstrained array', () => {
    const arrShape = new ArrayShape(null, null);

    const result = arrShape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY }],
    });
  });

  test('does not check array elements if there are no tuple element shapes and no rest element shape', () => {
    const arrShape = new ArrayShape(null, null);

    const arr = [111, 222];
    const result = arrShape.try(arr) as Ok<unknown>;

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
    const result = arrShape.try(arr) as Ok<unknown>;

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
    const result = arrShape.try(arr) as Ok<unknown>;

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
    const result = arrShape.try(arr) as Ok<unknown>;

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
      issues: [{ code: CODE_TUPLE, input: [111], message: 'Must be a tuple of length 2', param: 2 }],
    });
  });

  test('raises an issue if an input is not a tuple', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], null);

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
    });
  });

  test('raises an issue if an input is not an array', () => {
    const arrShape = new ArrayShape(null, new Shape());

    expect(arrShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY }],
    });
  });

  test('raises an issue if an input is too short for tuple with rest elements', () => {
    const arrShape = new ArrayShape([new Shape(), new Shape()], new Shape());

    expect(arrShape.try(['aaa'])).toEqual({
      ok: false,
      issues: [{ code: CODE_TUPLE, input: ['aaa'], message: 'Must be a tuple of length 2', param: 2 }],
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
    const result = arrShape.try(arr) as Ok<unknown>;

    expect(arr).toEqual([111, 222]);
    expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
    expect(result.value).not.toBe(arr);
  });

  test('applies checks', () => {
    const arrShape = new ArrayShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(arrShape.try([111])).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not apply checks if a tuple element raises an issue', () => {
    const arrShape = new ArrayShape([new StringShape()], null).check(() => [{ code: 'xxx' }]);

    expect(arrShape.try([111], { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: [0] }],
    });
  });

  test('applies unsafe checks if a tuple element raises an issue', () => {
    const arrShape = new ArrayShape([new StringShape()], null).check({ unsafe: true }, () => [{ code: 'xxx' }]);

    expect(arrShape.try([111], { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: [0] },
        { code: 'xxx' },
      ],
    });
  });

  describe('at', () => {
    test('returns the tuple element shape', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();

      const arrShape = new ArrayShape([shape1, shape2], null);

      expect(arrShape.at('0')).toBe(shape1);
      expect(arrShape.at('1')).toBe(shape2);
      expect(arrShape.at('2')).toBeNull();

      expect(arrShape.at(0)).toBe(shape1);
      expect(arrShape.at(1)).toBe(shape2);
      expect(arrShape.at(2)).toBeNull();

      expect(arrShape.at('000')).toBeNull();
      expect(arrShape.at('1e+49')).toBeNull();
      expect(arrShape.at(-111)).toBeNull();
      expect(arrShape.at(111.222)).toBeNull();
      expect(arrShape.at('aaa')).toBeNull();
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
  });

  describe('rest', () => {
    test('returns the shape clone with updated rest elements', () => {
      const restShape = new Shape();

      expect(new ArrayShape(null, null).rest(restShape).restShape).toBe(restShape);
    });

    test('copies unsafe checks', () => {
      const cbMock1 = jest.fn();
      const cbMock2 = jest.fn();

      const arrShape = new ArrayShape(null, null).check({ unsafe: true }, cbMock1).check(cbMock2);

      arrShape.rest(new Shape()).parse([]);

      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock2).not.toHaveBeenCalled();
    });
  });

  describe('length', () => {
    test('checks length', () => {
      const arrShape = new ArrayShape(null, new Shape()).length(2);

      expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
      expect(arrShape.try([111])).toEqual({ ok: false, issues: expect.any(Array) });
      expect(arrShape.try([111, 222, 333])).toEqual({ ok: false, issues: expect.any(Array) });
    });
  });

  describe('min', () => {
    test('checks min length', () => {
      const arrShape = new ArrayShape(null, new Shape()).min(2);

      expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
      expect(arrShape.try([111])).toEqual({
        ok: false,
        issues: [{ code: CODE_ARRAY_MIN, input: [111], message: 'Must have the minimum length of 2', param: 2 }],
      });
    });
  });

  describe('max', () => {
    test('checks max length', () => {
      const arrShape = new ArrayShape(null, new Shape()).max(2);

      expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
      expect(arrShape.try([111, 222, 333])).toEqual({
        ok: false,
        issues: [
          { code: CODE_ARRAY_MAX, input: [111, 222, 333], message: 'Must have the maximum length of 2', param: 2 },
        ],
      });
    });
  });

  describe('deepPartial', () => {
    test('raises an issue if deep partial tuple length is invalid', () => {
      const arrShape = new ArrayShape(
        [new ObjectShape({ key1: new StringShape() }, null)],
        new NumberShape()
      ).deepPartial();

      expect(arrShape.parse([undefined])).toEqual([undefined]);

      expect(arrShape.try([])).toEqual({
        ok: false,
        issues: [{ code: CODE_TUPLE, input: [], message: 'Must be a tuple of length 1', param: 1 }],
      });
    });

    test('raises an issue if deep partial element is invalid', () => {
      const arrShape = new ArrayShape(null, new NumberShape()).deepPartial();

      expect(arrShape.try(['aaa'])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, path: [0], input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER }],
      });
    });

    test('parses deep partial tuple with rest elements', () => {
      const arrShape = new ArrayShape(
        [new ObjectShape({ key1: new StringShape() }, null)],
        new NumberShape()
      ).deepPartial();

      expect(arrShape.parse([undefined])).toEqual([undefined]);
      expect(arrShape.parse([{}])).toEqual([{}]);
      expect(arrShape.parse([{}, undefined])).toEqual([{}, undefined]);
      expect(arrShape.parse([undefined, undefined])).toEqual([undefined, undefined]);
      expect(arrShape.parse([{}, 111, undefined])).toEqual([{}, 111, undefined]);
      expect(arrShape.parse([{ key1: undefined }])).toEqual([{ key1: undefined }]);
    });

    test('parses deep partial array', () => {
      const arrShape = new ArrayShape(null, new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      expect(arrShape.parse([undefined])).toEqual([undefined]);
      expect(arrShape.parse([{}])).toEqual([{}]);
      expect(arrShape.parse([{}, undefined])).toEqual([{}, undefined]);
      expect(arrShape.parse([undefined, { key1: undefined }])).toEqual([undefined, { key1: undefined }]);
    });
  });

  describe('coerce', () => {
    test('allow any input type when shape is coerced and elements are unconstrained', () => {
      const arrShape = new ArrayShape(null, null).coerce();

      expect(arrShape.inputTypes).toEqual([TYPE_UNKNOWN]);
    });

    test('allows only array-like types when tuple has two elements', () => {
      const arrShape = new ArrayShape([new StringShape(), new NumberShape()], null).coerce();

      expect(arrShape.inputTypes).toEqual([TYPE_OBJECT, TYPE_ARRAY]);
    });

    test('allows input types of a single tuple element', () => {
      const arrShape = new ArrayShape([new StringShape()], null).coerce();

      expect(arrShape.inputTypes).toEqual([TYPE_STRING, TYPE_OBJECT, TYPE_ARRAY]);
    });

    test('does not coerce if a tuple has no elements', () => {
      const arrShape = new ArrayShape([], null).coerce();

      expect(arrShape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 0', param: 0 }],
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
        issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
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

    test('coerces a Set', () => {
      const arrShape = new ArrayShape(null, new Shape()).coerce();

      expect(arrShape.parse(new Set(['aaa']))).toEqual(['aaa']);
    });

    test('coerces a Map to an array of entries', () => {
      const arrShape = new ArrayShape(null, new Shape()).coerce();

      expect(
        arrShape.parse(
          new Map([
            ['key1', 'aaa'],
            ['key2', 'bbb'],
          ])
        )
      ).toEqual([
        ['key1', 'aaa'],
        ['key2', 'bbb'],
      ]);
    });

    test('coerces an array-like object', () => {
      const arrShape = new ArrayShape(null, new Shape()).coerce();

      expect(arrShape.parse({ length: 1, 0: 'aaa' })).toEqual(['aaa']);
    });

    test('coerces a String wrapper', () => {
      const arrShape = new ArrayShape(null, new Shape()).coerce();

      expect(arrShape.parse(new String('aaa'))).toEqual(['aaa']);
    });

    test('does not coerce if a tuple has more than one element with rest elements', () => {
      const arrShape = new ArrayShape([new Shape(), new Shape()], new Shape()).coerce();

      expect(arrShape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
      });
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not an unconstrained array', async () => {
      const arrShape = new ArrayShape(null, asyncShape);

      const result = await arrShape.tryAsync('aaa');

      expect(result).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_ARRAY_TYPE, param: TYPE_ARRAY }],
      });
    });

    test('downgrades to sync implementation if there are no async element shapes', async () => {
      const arrShape = new ArrayShape(null, new Shape());

      const applySpy = jest.spyOn<Shape, any>(arrShape, '_apply');

      await expect(arrShape.tryAsync([])).resolves.toEqual({ ok: true, value: [] });
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, [], { verbose: false, coerced: false });
    });

    test('parses tuple elements', async () => {
      const shape1 = new Shape();
      const shape2 = asyncShape;

      shape1.isAsync;
      shape2.isAsync;

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');

      const arrShape = new ArrayShape([shape1, shape2], null);

      const arr = [111, 222];
      const result = (await arrShape.tryAsync(arr)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenNthCalledWith(1, 222, { verbose: false, coerced: false });
    });

    test('does not apply tuple element shape if previous shape raised an issue', async () => {
      const shape1 = asyncShape.check(() => [{ code: 'xxx' }]);
      const shape2 = asyncShape;

      shape1.isAsync;
      shape2.isAsync;

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');

      const arrShape = new ArrayShape([shape1, shape2], null);

      const arr = [111, 222];
      const result = (await arrShape.tryAsync(arr)) as Err;

      expect(result).toEqual({ ok: false, issues: [{ code: 'xxx', path: [0] }] });
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(applySpy2).not.toHaveBeenCalled();
    });

    test('parses rest elements', async () => {
      const restApplySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

      const arrShape = new ArrayShape(null, asyncShape);

      const arr = [111, 222];
      const result = (await arrShape.tryAsync(arr)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: arr });
      expect(result.value).toBe(arr);
      expect(restApplySpy).toHaveBeenCalledTimes(2);
      expect(restApplySpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(restApplySpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
    });

    test('clones an array if a tuple element was transformed', async () => {
      const shape1 = new Shape();
      const shape2 = new Shape().transformAsync(() => Promise.resolve('aaa'));

      const arrShape = new ArrayShape([shape1, shape2], null);

      const arr = [111, 222];
      const result = (await arrShape.tryAsync(arr)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
      expect(result.value).not.toBe(arr);
    });

    test('applies checks', async () => {
      const arrShape = new ArrayShape(null, asyncShape).check(() => [{ code: 'xxx' }]);

      await expect(arrShape.tryAsync([111])).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    describe('coerce', () => {
      test('coerces a non-array to an array', async () => {
        const arrShape = new ArrayShape(null, asyncShape).coerce();

        await expect(arrShape.parseAsync('aaa')).resolves.toEqual(['aaa']);
      });

      test('coerces a non-array to a tuple of one element', async () => {
        const arrShape = new ArrayShape([new Shape()], asyncShape).coerce();

        await expect(arrShape.parseAsync('aaa')).resolves.toEqual(['aaa']);
      });

      test('does not coerce if a tuple has more than one element with rest elements', async () => {
        const arrShape = new ArrayShape([new Shape(), new Shape()], asyncShape).coerce();

        await expect(arrShape.tryAsync('aaa')).resolves.toEqual({
          ok: false,
          issues: [{ code: CODE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
        });
      });
    });
  });
});
