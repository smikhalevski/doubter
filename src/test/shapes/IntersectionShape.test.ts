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
import { CODE_TYPE, CODE_TYPE_INTERSECTION } from '../../main/constants';
import { mergeValues } from '../../main/shape/IntersectionShape';
import { TYPE_BOOLEAN, TYPE_NUMBER, TYPE_STRING } from '../../main/Type';
import { AsyncMockShape } from './mocks';

describe('IntersectionShape', () => {
  test('returns the input as is if it matches all intersected shapes', () => {
    const input = { key1: 'aaa', key2: 111 };

    const shape = new IntersectionShape([
      new ObjectShape({ key1: new StringShape() }, null),
      new ObjectShape({ key2: new NumberShape() }, null),
    ]);

    expect(shape.parse(input)).toBe(input);
  });

  test('returns the intersection of converted shapes', () => {
    const input = { key1: 'aaa', key2: 111 };

    const shape = new IntersectionShape([
      new ObjectShape({ key1: new StringShape().convert(() => 'xxx') }, null).strip(),
      new ObjectShape({ key2: new NumberShape().convert(() => 'yyy') }, null).strip(),
    ]);

    expect(shape.parse(input)).toEqual({ key1: 'xxx', key2: 'yyy' });
  });

  test('can be used in conjunction with union shape', () => {
    const shape = new IntersectionShape([new UnionShape([new StringShape(), new NumberShape()]), new NumberShape()]);

    expect(shape.parse(111)).toBe(111);
  });

  test('NaN values are equal', () => {
    const shape = new IntersectionShape([new Shape(), new Shape()]);

    expect(shape.parse(NaN)).toBe(NaN);
  });

  test('raises an issue if an input does not conform one of shapes in an early-return mode', () => {
    const shape = new IntersectionShape([new NumberShape(), new NumberShape()]);

    expect(shape.try('aaa', { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.number'], param: TYPE_NUMBER }],
    });
  });

  test('raises multiple issues if an input does not conform several shapes', () => {
    const shape = new IntersectionShape([new NumberShape(), new BooleanShape()]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.number'], param: TYPE_NUMBER },
        { code: CODE_TYPE, input: 'aaa', message: Shape.messages['type.boolean'], param: TYPE_BOOLEAN },
      ],
    });
  });

  test('raises an issue if outputs cannot be intersected', () => {
    const shape = new IntersectionShape([new StringShape(), new StringShape().convert(parseFloat)]);

    expect(shape.try('111.222')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_INTERSECTION, input: '111.222', message: Shape.messages['type.intersection'] }],
    });
  });

  test('raises an issue if child outputs cannot be intersected', () => {
    const shape = new IntersectionShape([
      new ArrayShape([], new StringShape()),
      new ArrayShape([], new StringShape().convert(parseFloat)),
    ]);

    expect(shape.try(['111.222'])).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_INTERSECTION, input: ['111.222'], message: Shape.messages['type.intersection'] }],
    });
  });

  test('empty intersections produce no issues', () => {
    const shape = new IntersectionShape([]);

    expect(shape.try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('applies operations', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const shape = new IntersectionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(shape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('does not apply operations if an intersected shape raises an issue', () => {
    const shape1 = new Shape();
    const shape2 = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new IntersectionShape([shape1, shape2]).check(() => [{ code: 'yyy' }], { force: true });

    expect(shape.try({}, { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns an intersection of child shapes at key', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();
      const restShape = new Shape();

      const shape1 = new ObjectShape({ 1: valueShape1, key1: valueShape2 }, null);
      const shape2 = new ArrayShape([], restShape);

      const shape = new IntersectionShape([shape1, shape2]).at(1) as IntersectionShape<AnyShape[]>;

      expect(shape instanceof IntersectionShape).toBe(true);
      expect(shape.shapes.length).toBe(2);
      expect(shape.shapes[0]).toBe(valueShape1);
      expect(shape.shapes[1]).toBe(restShape);
    });

    test('returns null if key does not exist in any of children', () => {
      expect(new IntersectionShape([new Shape(), new Shape()]).at('aaa')).toBeNull();
    });
  });

  describe('deepPartial', () => {
    test('parses intersected deep partial objects', () => {
      const shape = new IntersectionShape([
        new ObjectShape({ key1: new StringShape() }, null),
        new ObjectShape({ key2: new StringShape() }, null),
      ]).deepPartial();

      expect(shape.parse({})).toEqual({});
      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key2: 'aaa' })).toEqual({ key2: 'aaa' });
      expect(shape.parse({ key1: 'aaa', key2: undefined })).toEqual({ key1: 'aaa', key2: undefined });
    });

    test('does not make shapes optional', () => {
      const shape = new IntersectionShape([new NumberShape()]).deepPartial();

      expect(shape.parse(111)).toBe(111);
      expect(shape.try(undefined)).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, message: Shape.messages['type.number'], param: TYPE_NUMBER }],
      });
    });
  });

  describe('inputs', () => {
    test('empty if there are no common values', () => {
      const shape = new IntersectionShape([new EnumShape(['aaa', 'bbb']), new EnumShape([111, 222])]);

      expect(shape.inputs).toEqual([]);
    });

    test('empty if contains a NeverShape', () => {
      const shape = new IntersectionShape([new StringShape(), new NeverShape()]);

      expect(shape.inputs).toEqual([]);
    });

    test('the array of common values', () => {
      const shape = new IntersectionShape([new EnumShape(['aaa', 111]), new EnumShape([222, 'aaa'])]);

      expect(shape.inputs).toEqual(['aaa']);
    });

    test('slices values from the compatible continuous range', () => {
      expect(new IntersectionShape([new NumberShape(), new EnumShape([111, 222])]).inputs).toEqual([111, 222]);
    });

    test('empty if types are incompatible', () => {
      expect(new IntersectionShape([new StringShape(), new EnumShape([111, 222])]).inputs).toEqual([]);
    });

    test('complex composites', () => {
      expect(new IntersectionShape([new StringShape(), new EnumShape(['aaa', 111])]).inputs).toEqual(['aaa']);
    });

    test('unknown is erased', () => {
      expect(new IntersectionShape([new StringShape(), new Shape()]).inputs).toEqual([TYPE_STRING]);
      expect(new IntersectionShape([new NeverShape(), new Shape()]).inputs).toEqual([]);
    });
  });

  describe('async', () => {
    test('returns the input as is if it matches all intersected shapes', async () => {
      const input = { key1: 'aaa', key2: 111 };

      const shape = new IntersectionShape([
        new ObjectShape({ key1: new StringShape() }, null).convertAsync(value => Promise.resolve(value)),
        new ObjectShape({ key2: new NumberShape().convertAsync(value => Promise.resolve(value)) }, null),
      ]);

      await expect(shape.parseAsync(input)).resolves.toBe(input);
    });

    test('raises an issue if child outputs cannot be intersected', async () => {
      const shape = new IntersectionShape([
        new ArrayShape([], new StringShape()),
        new ArrayShape([], new StringShape().convertAsync(value => Promise.resolve(value)).convert(parseFloat)),
      ]);

      await expect(shape.tryAsync(['111.222'])).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_INTERSECTION, input: ['111.222'], message: Shape.messages['type.intersection'] }],
      });
    });

    test('does not swallow errors', async () => {
      const shape = new IntersectionShape([
        new AsyncMockShape(),
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        }),
      ]);

      await expect(shape.tryAsync([111, 111])).rejects.toEqual(new Error('expected'));
    });
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

  describe('Date', () => {
    test('returns the left date if dates have the same time', () => {
      const value = new Date(111);

      expect(mergeValues(value, new Date(111))).toBe(value);
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
});
