import {
  AnyShape,
  ArrayShape,
  BooleanShape,
  EnumShape,
  IntersectionShape,
  NEVER,
  NeverShape,
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
import { intersectTypes, intersectValues, mergeValues } from '../../main/shapes/IntersectionShape';

describe('IntersectionShape', () => {
  test('returns the input as is if it matches all intersected shapes', () => {
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
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER }],
    });
  });

  test('raises an issue if an input does not conform several shapes in verbose mode', () => {
    const andShape = new IntersectionShape([new NumberShape(), new BooleanShape()]);

    expect(andShape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE, input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER },
        { code: CODE_TYPE, input: 'aaa', message: MESSAGE_BOOLEAN_TYPE, param: TYPE_BOOLEAN },
      ],
    });
  });

  test('raises an issue if outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([new StringShape(), new StringShape().transform(parseFloat)]);

    expect(andShape.try('111.222')).toEqual({
      ok: false,
      issues: [{ code: CODE_INTERSECTION, input: '111.222', message: MESSAGE_INTERSECTION }],
    });
  });

  test('raises an issue if child outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([
      new ArrayShape(null, new StringShape()),
      new ArrayShape(null, new StringShape().transform(parseFloat)),
    ]);

    expect(andShape.try(['111.222'])).toEqual({
      ok: false,
      issues: [{ code: CODE_INTERSECTION, input: ['111.222'], message: MESSAGE_INTERSECTION }],
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
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not apply checks if an intersected shape raises an issue', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const orShape = new IntersectionShape([shape1, shape2]).check({ unsafe: true }, () => [{ code: 'yyy' }]);

    expect(orShape.try({}, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
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

    test('returns null if key does not exist in any of children', () => {
      expect(new IntersectionShape([new Shape(), new Shape()]).at('aaa')).toBeNull();
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
        issues: [{ code: CODE_TYPE, message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER }],
      });
    });
  });

  describe('inputTypes', () => {
    test('never if there are no common values', () => {
      const shape = new IntersectionShape([new EnumShape(['aaa', 'bbb']), new EnumShape([111, 222])]);

      expect(shape.inputTypes).toEqual([TYPE_NEVER]);
      expect(shape.inputValues!.length).toBe(0);
    });

    test('never if contains a NeverShape', () => {
      const shape = new IntersectionShape([new StringShape(), new NeverShape()]);

      expect(shape.inputTypes).toEqual([TYPE_NEVER]);
      expect(shape.inputValues!.length).toBe(0);
    });
  });

  describe('inputValues', () => {
    test('the array of common values', () => {
      const shape = new IntersectionShape([new EnumShape(['aaa', 111]), new EnumShape([222, 'aaa'])]);

      expect(shape.inputValues).toEqual(['aaa']);
    });

    test('null if underlying shapes accept continuous value ranges', () => {
      expect(new IntersectionShape([new NumberShape()]).inputValues).toBeNull();
    });

    test('slices values from the compatible continuous range', () => {
      expect(new IntersectionShape([new NumberShape(), new EnumShape([111, 222])]).inputValues).toEqual([111, 222]);
    });

    test('an empty array if types are incompatible', () => {
      expect(new IntersectionShape([new StringShape(), new EnumShape([111, 222])]).inputValues).toEqual([]);
    });

    test('complex composites', () => {
      expect(new IntersectionShape([new StringShape(), new EnumShape(['aaa', 111])]).inputValues).toEqual(['aaa']);
    });
  });

  describe('async', () => {
    test('returns the input as is if it matches all intersected shapes', async () => {
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
        issues: [{ code: CODE_INTERSECTION, input: ['111.222'], message: MESSAGE_INTERSECTION }],
      });
    });
  });
});

describe('intersectTypes', () => {
  test('never absorbs other types', () => {
    expect(intersectTypes([[TYPE_STRING], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
  });

  test('any absorbs other types', () => {
    expect(intersectTypes([[TYPE_STRING], [TYPE_ANY]])).toEqual([TYPE_ANY]);
  });

  test('never absorbs any', () => {
    expect(intersectTypes([[TYPE_ANY], [TYPE_NEVER]])).toEqual([TYPE_NEVER]);
  });

  test('returns the shared type', () => {
    expect(intersectTypes([[TYPE_STRING], [TYPE_STRING, TYPE_NUMBER]])).toEqual([TYPE_STRING]);
  });

  test('returns never if there are no shared types', () => {
    expect(intersectTypes([[TYPE_STRING], [TYPE_NUMBER]])).toEqual([TYPE_NEVER]);
  });

  test('returns never if there are no types at all', () => {
    expect(intersectTypes([])).toEqual([TYPE_NEVER]);
  });
});

describe('intersectValues', () => {
  test('returns values that present in all buckets', () => {
    expect(
      intersectValues([
        [1, 2, 3],
        [1, 2],
        [2, 3],
      ])
    ).toEqual([2]);
  });

  test('returns an empty array if there are no common values', () => {
    expect(
      intersectValues([
        [1, 2, 3],
        [4, 5],
        [6, 7],
      ])
    ).toEqual([]);
  });

  test('returns an null if there are no buckets', () => {
    expect(intersectValues([])).toBeNull();
  });

  test('returns an empty array if no common values', () => {
    expect(intersectValues([[1, 2, 3], [], null])).toEqual([]);
    expect(intersectValues([[1, 2, 3], []])).toEqual([]);
    expect(
      intersectValues([
        [1, 2],
        [3, 4],
      ])
    ).toEqual([]);
  });

  test('null if all buckets are null', () => {
    expect(intersectValues([null, null])).toBeNull();
  });
});

describe('mergeValues', () => {
  describe('primitive', () => {
    test('returns value if primitives are equal', () => {
      expect(mergeValues(111, 111)).toBe(111);
      expect(mergeValues('aaa', 'aaa')).toBe('aaa');
    });

    test('returns NEVER if primitive values are not equal', () => {
      expect(mergeValues(111, 222)).toBe(NEVER);
    });
  });

  describe('Promise', () => {
    test('always returns the left promise', () => {
      const value = Promise.resolve(111);

      expect(mergeValues(value, Promise.resolve(222))).toBe(value);
    });
  });

  describe('Date', () => {
    test('returns the left date if dates have the same time', () => {
      const date = new Date(111);

      expect(mergeValues(date, new Date(111))).toBe(date);
    });

    test('returns NEVER if dates do not have the same time', () => {
      expect(mergeValues(new Date(111), new Date(222))).toBe(NEVER);
    });
  });

  describe('Object', () => {
    test('merges objects', () => {
      expect(mergeValues({ aaa: 111 }, { aaa: 111, bbb: 222 })).toEqual({ aaa: 111, bbb: 222 });
      expect(mergeValues({ aaa: 111 }, { bbb: 222, ccc: 333 })).toEqual({ aaa: 111, bbb: 222, ccc: 333 });
    });

    test('returns NEVER if objects have different values for the same key', () => {
      expect(mergeValues({ aaa: 111 }, { aaa: 222 })).toEqual(NEVER);
    });
  });

  describe('Array', () => {
    test('merges equal arrays', () => {
      expect(mergeValues([111], [111])).toEqual([111]);
    });

    test('merges nested objects', () => {
      expect(mergeValues([{ aaa: 111 }], [{ bbb: 222 }])).toEqual([{ aaa: 111, bbb: 222 }]);
    });

    test('returns NEVER if arrays have different length', () => {
      expect(mergeValues([111], [111, 222])).toEqual(NEVER);
      expect(mergeValues([111], [])).toEqual(NEVER);
    });

    test('returns NEVER if arrays have different elements in same positions', () => {
      expect(mergeValues([111], [222])).toEqual(NEVER);
    });
  });

  describe('Set', () => {
    test('merges Set instances', () => {
      expect(mergeValues(new Set([111]), new Set([222, 333]))).toEqual(new Set([111, 222, 333]));
    });
  });

  describe('Map', () => {
    test('merges non-shared keys', () => {
      expect(mergeValues(new Map([['aaa', 111]]), new Map([['bbb', 222]]))).toEqual(
        new Map([
          ['aaa', 111],
          ['bbb', 222],
        ])
      );
    });

    test('merges nested objects', () => {
      expect(mergeValues(new Map([['aaa', { bbb: 111 }]]), new Map([['aaa', { ccc: 222 }]]))).toEqual(
        new Map([['aaa', { bbb: 111, ccc: 222 }]])
      );
    });

    test('returns NEVER if nested objects cannot be intersected', () => {
      expect(mergeValues(new Map([['aaa', { bbb: 111 }]]), new Map([['aaa', { bbb: 222 }]]))).toBe(NEVER);
    });

    test('preserves shared Map keys as is if they are equal', () => {
      expect(
        mergeValues(
          new Map([['aaa', 111]]),
          new Map([
            ['aaa', 111],
            ['bbb', 222],
          ])
        )
      ).toEqual(
        new Map([
          ['aaa', 111],
          ['bbb', 222],
        ])
      );
    });

    test('returns NEVER if Maps have non-equal values for shared keys', () => {
      expect(mergeValues(new Map([['aaa', 111]]), new Map([['aaa', 222]]))).toBe(NEVER);
    });
  });
});
