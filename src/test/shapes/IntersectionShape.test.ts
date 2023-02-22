import {
  AnyShape,
  ArrayShape,
  BooleanShape,
  IntersectionShape,
  NumberShape,
  ObjectShape,
  Shape,
  StringShape,
  UnionShape,
} from '../../main';
import {
  CODE_INTERSECTION,
  CODE_TYPE,
  MESSAGE_BOOLEAN_TYPE,
  MESSAGE_INTERSECTION,
  MESSAGE_NUMBER_TYPE,
  TYPE_ANY,
  TYPE_BOOLEAN,
  TYPE_NEVER,
  TYPE_NUMBER,
  TYPE_STRING,
} from '../../main/constants';
import { intersectValues, intersectValueTypes } from '../../main/shapes/IntersectionShape';
import { NEVER } from '../../main/utils';

describe('IntersectionShape', () => {
  test('returns the input that matches all shapes as is', () => {
    const obj = { key1: 'aaa', key2: 111 };

    const andShape = new IntersectionShape([
      new ObjectShape(
        {
          key1: new StringShape(),
        },
        null
      ),
      new ObjectShape(
        {
          key2: new NumberShape(),
        },
        null
      ),
    ]);

    expect(andShape.parse(obj)).toBe(obj);
  });

  test('returns the intersection of transformed shapes', () => {
    const obj = { key1: 'aaa', key2: 111 };

    const andShape = new IntersectionShape([
      new ObjectShape(
        {
          key1: new StringShape().transform(() => 'xxx'),
        },
        null
      ).strip(),
      new ObjectShape(
        {
          key2: new NumberShape().transform(() => 'yyy'),
        },
        null
      ).strip(),
    ]);

    expect(andShape.parse(obj)).toEqual({ key1: 'xxx', key2: 'yyy' });
  });

  test('can be used in conjunction with union shape', () => {
    const andShape = new IntersectionShape([new UnionShape([new StringShape(), new NumberShape()]), new NumberShape()]);

    expect(andShape.parse(111)).toBe(111);
  });

  test('NaN values are equal', () => {
    const andShape = new IntersectionShape([new Shape(), new Shape()]);

    expect(andShape.parse(NaN)).toBe(NaN);
  });

  test('raises an issue if an input does not conform one of shapes', () => {
    const andShape = new IntersectionShape([new NumberShape(), new NumberShape()]);

    expect(andShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, path: [] }],
    });
  });

  test('raises an issue if an input does not conform several shapes in verbose mode', () => {
    const andShape = new IntersectionShape([new NumberShape(), new BooleanShape()]);

    expect(andShape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE, input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, path: [] },
        { code: CODE_TYPE, input: 'aaa', message: MESSAGE_BOOLEAN_TYPE, param: TYPE_BOOLEAN, path: [] },
      ],
    });
  });

  test('raises an issue if outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([new StringShape(), new StringShape().transform(parseFloat)]);

    expect(andShape.try('111.222')).toEqual({
      ok: false,
      issues: [{ code: CODE_INTERSECTION, path: [], input: '111.222', message: MESSAGE_INTERSECTION }],
    });
  });

  test('raises an issue if child outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([
      new ArrayShape(null, new StringShape()),
      new ArrayShape(null, new StringShape().transform(parseFloat)),
    ]);

    expect(andShape.try(['111.222'])).toEqual({
      ok: false,
      issues: [{ code: CODE_INTERSECTION, input: ['111.222'], message: MESSAGE_INTERSECTION, path: [] }],
    });
  });

  test('empty intersections produce no issues', () => {
    const orShape = new IntersectionShape([]);

    expect(orShape.try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('applies checks', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const orShape = new IntersectionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(orShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('does not apply checks if an intersected shape raises an error', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const orShape = new IntersectionShape([shape1, shape2]).check(() => [{ code: 'yyy' }]);

    expect(orShape.try({}, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('applies unsafe checks if an intersected shape raises an error', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const orShape = new IntersectionShape([shape1, shape2]).check(() => [{ code: 'yyy' }], { unsafe: true });

    expect(orShape.try({}, { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [] },
        { code: 'yyy', path: [] },
      ],
    });
  });

  test('unsafe checks receive input value if intersection fails', () => {
    const shape1 = new Shape().transform(() => 'xxx');
    const shape2 = new Shape().transform(() => 'yyy');

    const checkMock = jest.fn(() => null);

    new IntersectionShape([shape1, shape2]).check(checkMock, { unsafe: true }).try('aaa');

    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 'aaa', { coerced: false, verbose: false });
  });

  describe('at', () => {
    test('returns an intersection of child shapes at key', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const shape3 = new Shape();
      const objShape = new ObjectShape({ 1: shape1, key1: shape2 }, null);
      const arrShape = new ArrayShape(null, shape3);

      const andShape = new IntersectionShape([objShape, arrShape]);

      const shape = andShape.at(1) as IntersectionShape<AnyShape[]>;

      expect(shape instanceof IntersectionShape).toBe(true);
      expect(shape.shapes.length).toBe(2);
      expect(shape.shapes[0]).toBe(shape1);
      expect(shape.shapes[1]).toBe(shape3);
    });

    test('returns null if key does not exist in all children', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const shape3 = new Shape();
      const objShape = new ObjectShape({ 1: shape1, key1: shape2 }, null);
      const arrShape = new ArrayShape(null, shape3);

      const andShape = new IntersectionShape([objShape, arrShape]);

      expect(andShape.at('key1')).toBe(null);
    });
  });

  describe('deepPartial', () => {
    test('parses intersected deep partial objects', () => {
      const andShape = new IntersectionShape([
        new ObjectShape({ key1: new StringShape() }, null),
        new ObjectShape({ key2: new StringShape() }, null),
      ]).deepPartial();

      expect(andShape.parse({})).toEqual({});
      expect(andShape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(andShape.parse({ key2: 'aaa' })).toEqual({ key2: 'aaa' });
      expect(andShape.parse({ key1: 'aaa', key2: undefined })).toEqual({ key1: 'aaa', key2: undefined });
    });

    test('does not make shapes optional', () => {
      const andShape = new IntersectionShape([new NumberShape()]).deepPartial();

      expect(andShape.parse(111)).toBe(111);
      expect(andShape.try(undefined)).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, path: [] }],
      });
    });
  });

  describe('async', () => {
    test('returns the input that matches all shapes as is', async () => {
      const obj = { key1: 'aaa', key2: 111 };

      const andShape = new IntersectionShape([
        new ObjectShape(
          {
            key1: new StringShape(),
          },
          null
        ).transformAsync(value => Promise.resolve(value)),
        new ObjectShape(
          {
            key2: new NumberShape().transformAsync(value => Promise.resolve(value)),
          },
          null
        ),
      ]);

      await expect(andShape.parseAsync(obj)).resolves.toBe(obj);
    });

    test('raises an issue if child outputs cannot be intersected', async () => {
      const andShape = new IntersectionShape([
        new ArrayShape(null, new StringShape()),
        new ArrayShape(null, new StringShape().transformAsync(value => Promise.resolve(value)).transform(parseFloat)),
      ]);

      await expect(andShape.tryAsync(['111.222'])).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_INTERSECTION, input: ['111.222'], message: MESSAGE_INTERSECTION, path: [] }],
      });
    });
  });
});

describe('intersectValues', () => {
  test('returns value if primitives are equal', () => {
    expect(intersectValues(111, 111)).toBe(111);
  });

  test('returns NEVER if primitive values are not equal', () => {
    expect(intersectValues(111, 222)).toBe(NEVER);
  });

  test('returns value if dates have the same time', () => {
    const date = new Date(111);

    expect(intersectValues(date, new Date(111))).toBe(date);
  });

  test('returns NEVER if dates do not have the same time', () => {
    expect(intersectValues(new Date(111), new Date(222))).toBe(NEVER);
  });

  test('merges objects', () => {
    expect(intersectValues({ aaa: 111 }, { bbb: 222 })).toEqual({ aaa: 111, bbb: 222 });
    expect(intersectValues({ aaa: 111 }, { aaa: 111, bbb: 222 })).toEqual({ aaa: 111, bbb: 222 });
    expect(intersectValues({ aaa: 111 }, { aaa: 222 })).toEqual(NEVER);
  });

  test('merges arrays', () => {
    expect(intersectValues([111], [111])).toEqual([111]);
    expect(intersectValues([111], [111, 222])).toEqual(NEVER);
    expect(intersectValues([111], [])).toEqual(NEVER);
  });
});

describe('intersectValueTypes', () => {
  test('never absorbs other types', () => {
    expect(intersectValueTypes([[TYPE_STRING], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
    expect(intersectValueTypes([[TYPE_ANY], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
  });

  test('any absorbs other types', () => {
    expect(intersectValueTypes([[TYPE_STRING], [TYPE_ANY]])).toEqual([TYPE_ANY]);
  });

  test('returns the shared type', () => {
    expect(intersectValueTypes([[TYPE_STRING], [TYPE_STRING, TYPE_NUMBER]])).toEqual([TYPE_STRING]);
  });

  test('returns never if there are no shared types', () => {
    expect(intersectValueTypes([[TYPE_STRING], [TYPE_NUMBER]])).toEqual([TYPE_NEVER]);
  });

  test('returns never if there are types', () => {
    expect(intersectValueTypes([])).toEqual([TYPE_NEVER]);
  });

  test('never absorbs other types', () => {
    expect(intersectValueTypes([[TYPE_STRING], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
  });

  test('never absorbs any type', () => {
    expect(intersectValueTypes([[TYPE_ANY], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
  });
});
