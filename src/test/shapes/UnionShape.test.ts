import { ArrayShape, NumberShape, StringShape, UnionShape } from '../../main';
import { CODE_TYPE, CODE_UNION, TYPE_NUMBER, TYPE_STRING } from '../../main/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

describe('UnionShape', () => {
  test('returns the input as is', () => {
    expect(new UnionShape([numberShape, stringShape]).parse('aaa')).toBe('aaa');
  });

  test('raises issues from all failures', () => {
    expect(new UnionShape([numberShape, stringShape]).validate(true)).toEqual([
      {
        code: CODE_UNION,
        path: [],
        input: true,
        param: [
          {
            code: CODE_TYPE,
            path: [],
            input: true,
            param: TYPE_NUMBER,
            message: expect.any(String),
            meta: undefined,
          },
          {
            code: CODE_TYPE,
            input: true,
            message: expect.any(String),
            param: TYPE_STRING,
            path: [],
          },
        ],
        message: 'Must conform a union',
        meta: undefined,
      },
    ]);
  });

  test('raises issues from the first failure in the async mode', async () => {
    const childShape1 = numberShape.transformAsync(value => Promise.resolve(value + ''));
    const childShape = stringShape.transformAsync(value => Promise.resolve(value + ''));

    expect(await new UnionShape([childShape1, childShape]).validateAsync(true, { verbose: true })).toEqual([
      {
        code: CODE_UNION,
        path: [],
        input: true,
        param: [
          {
            code: CODE_TYPE,
            path: [],
            input: true,
            param: TYPE_NUMBER,
            message: expect.any(String),
            meta: undefined,
          },
        ],
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('returns child type at key', () => {
    const shape = new UnionShape([new ArrayShape(numberShape), new ArrayShape(stringShape)]);

    expect(shape.at(0)).toStrictEqual(new UnionShape([numberShape, stringShape]));
    expect(shape.at('aaa')).toBe(null);
  });

  test('returns child type at key excluding nulls', () => {
    const shape = new UnionShape([new ArrayShape(numberShape), stringShape]);

    expect(shape.at(0)).toStrictEqual(numberShape);
    expect(shape.at(1)).toStrictEqual(numberShape);
  });
});
