import { ArrayShape, IntersectionShape, NumberShape, ObjectShape, Shape, StringShape, UnionShape } from '../../main';
import {
  CODE_INTERSECTION,
  CODE_TYPE,
  MESSAGE_INTERSECTION,
  MESSAGE_NUMBER_TYPE,
  TYPE_NUMBER,
} from '../../main/constants';
import { intersectPair, NEVER } from '../../main/shapes/IntersectionShape';

describe('IntersectionShape', () => {
  test('returns the input that matches all shapes as is', () => {
    const obj = { foo: 'aaa', bar: 111 };

    const andShape = new IntersectionShape([
      new ObjectShape(
        {
          foo: new StringShape(),
        },
        null
      ),
      new ObjectShape(
        {
          bar: new NumberShape(),
        },
        null
      ),
    ]);

    expect(andShape.parse(obj)).toBe(obj);
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
    const andShape = new IntersectionShape([new StringShape(), new NumberShape()]);

    expect(andShape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER, path: [] }],
    });
  });

  test('raises an issue if outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([new StringShape(), new StringShape().transform(parseFloat)]);

    expect(andShape.try('111.222')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_INTERSECTION,
          input: '111.222',
          message: MESSAGE_INTERSECTION,
          path: [],
        },
      ],
    });
  });

  test('raises an issue if child outputs cannot be intersected', () => {
    const andShape = new IntersectionShape([
      new ArrayShape(null, new StringShape()),
      new ArrayShape(null, new StringShape().transform(parseFloat)),
    ]);

    expect(andShape.try(['111.222'])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_INTERSECTION,
          input: ['111.222'],
          message: MESSAGE_INTERSECTION,
          path: [],
        },
      ],
    });
  });
});

describe('intersectPair', () => {
  test('returns value if primitives are equal', () => {
    expect(intersectPair(111, 111)).toBe(111);
  });

  test('returns NEVER if primitive values are not equal', () => {
    expect(intersectPair(111, 222)).toBe(NEVER);
  });

  test('returns value if dates have the same time', () => {
    const date = new Date(111);

    expect(intersectPair(date, new Date(111))).toBe(date);
  });

  test('returns NEVER if dates do not have the same time', () => {
    expect(intersectPair(new Date(111), new Date(222))).toBe(NEVER);
  });

  test('merges objects', () => {
    expect(intersectPair({ aaa: 111 }, { bbb: 222 })).toEqual({ aaa: 111, bbb: 222 });
    expect(intersectPair({ aaa: 111 }, { aaa: 111, bbb: 222 })).toEqual({ aaa: 111, bbb: 222 });
    expect(intersectPair({ aaa: 111 }, { aaa: 222 })).toEqual(NEVER);
  });

  test('merges arrays', () => {
    expect(intersectPair([111], [111])).toEqual([111]);
    expect(intersectPair([111], [111, 222])).toEqual(NEVER);
    expect(intersectPair([111], [])).toEqual(NEVER);
  });
});
