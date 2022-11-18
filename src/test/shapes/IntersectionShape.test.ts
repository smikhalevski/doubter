import { ArrayShape, IntersectionShape, NumberShape, ObjectShape, Shape, StringShape, UnionShape } from '../../main';
import {
  CODE_INTERSECTION,
  CODE_TYPE,
  MESSAGE_INTERSECTION,
  MESSAGE_NUMBER_TYPE,
  TYPE_NUMBER,
} from '../../main/constants';

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
