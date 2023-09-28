import { ArrayShape, Err, NumberShape, ObjectShape, Ok, StringShape } from '../../main';
import { CODE_TYPE, CODE_TYPE_TUPLE } from '../../main/constants';
import { resetNonce } from '../../main/internal/shapes';
import { TYPE_ARRAY, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING, TYPE_UNKNOWN } from '../../main/Type';
import { AsyncMockShape, MockShape, spyOnShape } from './mocks';

describe('ArrayShape', () => {
  beforeEach(() => {
    resetNonce();
  });

  test('creates an ArrayShape', () => {
    const headShape1 = new MockShape();
    const restShape = new MockShape();

    const shape = new ArrayShape([headShape1], restShape);

    expect(shape.headShapes).toEqual([headShape1]);
    expect(shape.restShape).toBe(restShape);
    expect(shape.inputs).toEqual([TYPE_ARRAY]);
    expect(shape.isAsync).toBe(false);
  });

  test('raises an issue if an input is not an unconstrained array', () => {
    const shape = new ArrayShape([], new MockShape());

    const result = shape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.array'], param: TYPE_ARRAY }],
    });
  });

  test('parses head elements', () => {
    const headShape1 = new MockShape();
    const headShape2 = new MockShape();

    const shape = new ArrayShape([headShape1, headShape2], null);

    const input = [111, 222];
    const result = shape.try(input) as Ok;

    expect(result).toEqual({ ok: true, value: input });
    expect(result.value).toBe(input);
    expect(headShape1._apply).toHaveBeenCalledTimes(1);
    expect(headShape1._apply).toHaveBeenNthCalledWith(1, 111, { earlyReturn: false, coerce: false }, 0);
    expect(headShape2._apply).toHaveBeenCalledTimes(1);
    expect(headShape2._apply).toHaveBeenNthCalledWith(1, 222, { earlyReturn: false, coerce: false }, 0);
  });

  test('parses rest elements', () => {
    const restShape = new MockShape();

    const shape = new ArrayShape([], restShape);

    const input = [111, 222];
    const result = shape.try(input) as Ok;

    expect(result).toEqual({ ok: true, value: input });
    expect(result.value).toBe(input);
    expect(restShape._apply).toHaveBeenCalledTimes(2);
    expect(restShape._apply).toHaveBeenNthCalledWith(1, 111, { earlyReturn: false, coerce: false }, 0);
    expect(restShape._apply).toHaveBeenNthCalledWith(2, 222, { earlyReturn: false, coerce: false }, 0);
  });

  test('parses both head and rest elements', () => {
    const headShape1 = new MockShape();
    const headShape2 = new MockShape();
    const restShape = new MockShape();

    const shape = new ArrayShape([headShape1, headShape2], restShape);

    const arr = [111, 222, 333, 444];
    const result = shape.try(arr) as Ok;

    expect(result).toEqual({ ok: true, value: arr });
    expect(result.value).toBe(arr);
    expect(headShape1._apply).toHaveBeenCalledTimes(1);
    expect(headShape1._apply).toHaveBeenNthCalledWith(1, 111, { earlyReturn: false, coerce: false }, 0);
    expect(headShape2._apply).toHaveBeenCalledTimes(1);
    expect(headShape2._apply).toHaveBeenNthCalledWith(1, 222, { earlyReturn: false, coerce: false }, 0);
    expect(restShape._apply).toHaveBeenCalledTimes(2);
    expect(restShape._apply).toHaveBeenNthCalledWith(1, 333, { earlyReturn: false, coerce: false }, 0);
    expect(restShape._apply).toHaveBeenNthCalledWith(2, 444, { earlyReturn: false, coerce: false }, 0);
  });

  test('raises an issue if the tuple length does not match head shapes', () => {
    const shape = new ArrayShape([new MockShape(), new MockShape()], null);

    expect(shape.try([111])).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_TUPLE, input: [111], message: 'Must be a tuple of length 2', param: 2 }],
    });
  });

  test('raises an issue if an input is not a tuple', () => {
    const shape = new ArrayShape([new MockShape(), new MockShape()], null);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
    });
  });

  test('raises an issue if an input is not an array', () => {
    const shape = new ArrayShape([], new MockShape());

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.array'], param: TYPE_ARRAY }],
    });
  });

  test('raises an issue if an input is too short for tuple with rest elements', () => {
    const shape = new ArrayShape([new MockShape(), new MockShape()], new MockShape());

    expect(shape.try(['aaa'])).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_TUPLE, input: ['aaa'], message: 'Must be a tuple of length 2', param: 2 }],
    });
  });

  test('rest shape can raise an issue in an early-return mode', () => {
    const restShape = new MockShape().check(() => [{ code: 'xxx' }]);
    const shape = new ArrayShape([], restShape);

    expect(shape.try(['aaa', 'bbb'], { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('rest shape can raise multiple issues', () => {
    const restShape = new MockShape().check(() => [{ code: 'xxx' }]);

    const shape = new ArrayShape([], restShape);

    expect(shape.try(['aaa', 'bbb'])).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'xxx', path: [1] },
      ],
    });
  });

  test('head shapes can raise an issue in an early-return mode', () => {
    const headShape1 = new MockShape().check(() => [{ code: 'xxx' }]);
    const headShape2 = new MockShape().check(() => [{ code: 'yyy' }]);

    const shape = new ArrayShape([headShape1, headShape2], null);

    expect(shape.try(['aaa', 'bbb'], { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('head shapes can raise multiple issues', () => {
    const headShape1 = new MockShape().check(() => [{ code: 'xxx' }]);
    const headShape2 = new MockShape().check(() => [{ code: 'yyy' }]);

    const shape = new ArrayShape([headShape1, headShape2], null);

    expect(shape.try(['aaa', 'bbb'])).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'yyy', path: [1] },
      ],
    });
  });

  test('clones an array if a tuple element was converted', () => {
    const headShape1 = new MockShape();
    const headShape2 = new MockShape().convert(() => 'aaa');

    const shape = new ArrayShape([headShape1, headShape2], null);

    const input = [111, 222];
    const result = shape.try(input) as Ok;

    expect(input).toEqual([111, 222]);
    expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
    expect(result.value).not.toBe(input);
  });

  test('applies operations', () => {
    const shape = new ArrayShape([], new MockShape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try([111])).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns the head element shape', () => {
      const headShape1 = new MockShape();
      const headShape2 = new MockShape();

      const shape = new ArrayShape([headShape1, headShape2], null);

      expect(shape.at('0')).toBe(headShape1);
      expect(shape.at('1')).toBe(headShape2);
      expect(shape.at('2')).toBeNull();

      expect(shape.at(0)).toBe(headShape1);
      expect(shape.at(1)).toBe(headShape2);
      expect(shape.at(2)).toBeNull();

      expect(shape.at('000')).toBeNull();
      expect(shape.at('1e+49')).toBeNull();
      expect(shape.at(-111)).toBeNull();
      expect(shape.at(111.222)).toBeNull();
      expect(shape.at('aaa')).toBeNull();
    });

    test('returns the rest element shape', () => {
      const restShape = new MockShape();

      const shape = new ArrayShape([], restShape);

      expect(shape.at(0)).toBe(restShape);
      expect(shape.at(1)).toBe(restShape);
    });

    test('returns the rest element shape when head element shapes are available', () => {
      const headShape = new MockShape();
      const restShape = new MockShape();

      const shape = new ArrayShape([headShape], restShape);

      expect(shape.at(0)).toBe(headShape);
      expect(shape.at(1)).toBe(restShape);
      expect(shape.at(2)).toBe(restShape);
    });
  });

  describe('rest', () => {
    test('returns the shape clone', () => {
      const shape = new ArrayShape([], null);

      expect(shape.rest(new MockShape())).not.toBe(shape);
    });

    test('sets rest shape', () => {
      const restShape = new MockShape();

      const shape = new ArrayShape([], null);

      expect(shape.rest(restShape).restShape).toBe(restShape);
    });

    test('strips operations', () => {
      expect(new ArrayShape([], null).check(() => null).rest(new MockShape()).operations.length).toBe(0);
    });
  });

  describe('deepPartial', () => {
    test('raises an issue if deep partial tuple length is invalid', () => {
      const shape = new ArrayShape(
        [new ObjectShape({ key1: new StringShape() }, null)],
        new NumberShape()
      ).deepPartial();

      expect(shape.parse([undefined])).toEqual([undefined]);

      expect(shape.try([])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_TUPLE, input: [], message: 'Must be a tuple of length 1', param: 1 }],
      });
    });

    test('raises an issue if deep partial element is invalid', () => {
      const shape = new ArrayShape([], new NumberShape()).deepPartial();

      expect(shape.try(['aaa'])).toEqual({
        ok: false,
        issues: [
          { code: CODE_TYPE, path: [0], input: 'aaa', message: Shape.messages['type.number'], param: TYPE_NUMBER },
        ],
      });
    });

    test('parses deep partial tuple with rest elements', () => {
      const shape = new ArrayShape(
        [new ObjectShape({ key1: new StringShape() }, null)],
        new NumberShape()
      ).deepPartial();

      expect(shape.parse([undefined])).toEqual([undefined]);
      expect(shape.parse([{}])).toEqual([{}]);
      expect(shape.parse([{}, undefined])).toEqual([{}, undefined]);
      expect(shape.parse([undefined, undefined])).toEqual([undefined, undefined]);
      expect(shape.parse([{}, 111, undefined])).toEqual([{}, 111, undefined]);
      expect(shape.parse([{ key1: undefined }])).toEqual([{ key1: undefined }]);
    });

    test('parses deep partial array', () => {
      const shape = new ArrayShape([], new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      expect(shape.parse([undefined])).toEqual([undefined]);
      expect(shape.parse([{}])).toEqual([{}]);
      expect(shape.parse([{}, undefined])).toEqual([{}, undefined]);
      expect(shape.parse([undefined, { key1: undefined }])).toEqual([undefined, { key1: undefined }]);
    });
  });

  describe('coerce', () => {
    test('allow unknown input type when shape is coerced and elements are unconstrained', () => {
      const shape = new ArrayShape([], null).coerce();

      expect(shape.inputs).toEqual([TYPE_UNKNOWN]);
    });

    test('allows only array-like types when tuple has two elements', () => {
      const shape = new ArrayShape([new StringShape(), new NumberShape()], null).coerce();

      expect(shape.inputs).toEqual([TYPE_OBJECT, TYPE_ARRAY]);
    });

    test('allows inputs of a single tuple element', () => {
      const shape = new ArrayShape([new StringShape()], null).coerce();

      expect(shape.inputs).toEqual([TYPE_STRING, TYPE_OBJECT, TYPE_ARRAY]);
    });

    test('does not coerce if an input tuple has no elements', () => {
      const shape = new ArrayShape([], null).coerce();

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 0', param: 0 }],
      });
    });

    test('coerces a non-array to a tuple of one element', () => {
      const shape = new ArrayShape([new MockShape()], null).coerce();

      expect(shape.parse('aaa')).toEqual(['aaa']);
    });

    test('does not coerce if a tuple has more than one element', () => {
      const shape = new ArrayShape([new MockShape(), new MockShape()], null).coerce();

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
      });
    });

    test('coerces a non-array to an array', () => {
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(shape.parse('aaa')).toEqual(['aaa']);
    });

    test('coerce if a tuple has no elements with rest elements', () => {
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(shape.parse('aaa')).toEqual(['aaa']);
    });

    test('coerces a non-array to a tuple of one element with rest elements', () => {
      const shape = new ArrayShape([new MockShape()], new MockShape()).coerce();

      expect(shape.parse('aaa')).toEqual(['aaa']);
    });

    test('coerces a Set', () => {
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(shape.parse(new Set(['aaa']))).toEqual(['aaa']);
    });

    test('coerces a Map to an array of entries', () => {
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(
        shape.parse(
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
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(shape.parse({ length: 1, 0: 'aaa' })).toEqual(['aaa']);
    });

    test('coerces a String object', () => {
      const shape = new ArrayShape([], new MockShape()).coerce();

      expect(shape.parse(new String('aaa'))).toEqual(['aaa']);
    });

    test('does not coerce if a tuple has more than one element with rest elements', () => {
      const shape = new ArrayShape([new MockShape(), new MockShape()], new MockShape()).coerce();

      expect(shape.try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
      });
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not an unconstrained array', async () => {
      const shape = new ArrayShape([], new AsyncMockShape());

      const result = await shape.tryAsync('aaa');

      expect(result).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.array'], param: TYPE_ARRAY }],
      });
    });

    test('downgrades to sync implementation if there are no async element shapes', async () => {
      const shape = spyOnShape(new ArrayShape([], new MockShape()));

      await expect(shape.tryAsync([])).resolves.toEqual({ ok: true, value: [] });
      expect(shape._apply).toHaveBeenCalledTimes(1);
      expect(shape._apply).toHaveBeenNthCalledWith(1, [], { earlyReturn: false, coerce: false }, 0);
    });

    test('parses head elements', async () => {
      const headShape1 = new MockShape();
      const headShape2 = new AsyncMockShape();

      const shape = new ArrayShape([headShape1, headShape2], null);

      const input = [111, 222];
      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(headShape1._apply).toHaveBeenCalledTimes(1);
      expect(headShape1._apply).toHaveBeenNthCalledWith(1, 111, { earlyReturn: false, coerce: false }, 0);
      expect(headShape2._applyAsync).toHaveBeenCalledTimes(1);
      expect(headShape2._applyAsync).toHaveBeenNthCalledWith(1, 222, { earlyReturn: false, coerce: false }, 0);
    });

    test('does not apply head element shape if previous shape raised an issue in an early-return mode', async () => {
      const headShape1 = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const headShape2 = new AsyncMockShape();

      const shape = new ArrayShape([headShape1, headShape2], null);

      const input = [111, 222];
      const result = (await shape.tryAsync(input, { earlyReturn: true })) as Err;

      expect(result).toEqual({ ok: false, issues: [{ code: 'xxx', path: [0] }] });
      expect(headShape1._applyAsync).toHaveBeenCalledTimes(1);
      expect(headShape1._applyAsync).toHaveBeenNthCalledWith(1, 111, { earlyReturn: true }, 0);
      expect(headShape2._applyAsync).not.toHaveBeenCalled();
    });

    test('parses rest elements', async () => {
      const restShape = new AsyncMockShape();

      const shape = new ArrayShape([], restShape);

      const input = [111, 222];
      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(restShape._applyAsync).toHaveBeenCalledTimes(2);
      expect(restShape._applyAsync).toHaveBeenNthCalledWith(1, 111, { earlyReturn: false, coerce: false }, 0);
      expect(restShape._applyAsync).toHaveBeenNthCalledWith(2, 222, { earlyReturn: false, coerce: false }, 0);
    });

    test('clones an array if a tuple element was converted', async () => {
      const headShape1 = new MockShape();
      const headShape2 = new MockShape().convertAsync(() => Promise.resolve('aaa'));

      const shape = new ArrayShape([headShape1, headShape2], null);

      const input = [111, 222];
      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: [111, 'aaa'] });
      expect(result.value).not.toBe(input);
    });

    test('applies operations', async () => {
      const shape = new ArrayShape([], new AsyncMockShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync([111])).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    describe('coerce', () => {
      test('coerces a non-array to an array', async () => {
        const shape = new ArrayShape([], new AsyncMockShape()).coerce();

        await expect(shape.parseAsync('aaa')).resolves.toEqual(['aaa']);
      });

      test('coerces a non-array to a tuple of one element', async () => {
        const shape = new ArrayShape([new MockShape()], new AsyncMockShape()).coerce();

        await expect(shape.parseAsync('aaa')).resolves.toEqual(['aaa']);
      });

      test('does not coerce if a tuple has more than one element with rest elements', async () => {
        const shape = new ArrayShape([new MockShape(), new MockShape()], new AsyncMockShape()).coerce();

        await expect(shape.tryAsync('aaa')).resolves.toEqual({
          ok: false,
          issues: [{ code: CODE_TYPE_TUPLE, input: 'aaa', message: 'Must be a tuple of length 2', param: 2 }],
        });
      });
    });

    test('does not swallow errors', async () => {
      const shape = new ArrayShape(
        [
          new AsyncMockShape(),
          new AsyncMockShape().check(() => {
            throw new Error('expected');
          }),
        ],
        null
      );

      await expect(shape.tryAsync([111, 222])).rejects.toEqual(new Error('expected'));
    });
  });
});
