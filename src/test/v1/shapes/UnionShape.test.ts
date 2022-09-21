import { ArrayShape, NumberShape, StringShape, UnionShape } from '../../../main';

const stringShape = new StringShape();
const numberShape = new NumberShape();

describe('UnionShape', () => {
  test('returns the input as is', () => {
    expect(new UnionShape([numberShape, stringShape]).parse('aaa')).toBe('aaa');
  });

  test('raises issues from all failures', () => {
    expect(new UnionShape([numberShape, stringShape]).validate(true)).toEqual([
      {
        code: 'union',
        path: [],
        input: true,
        param: [
          {
            code: 'type',
            path: [],
            input: true,
            param: 'number',
            message: 'Must be a number',
            meta: undefined,
          },
          {
            code: 'type',
            input: true,
            message: 'Must be a string',
            param: 'string',
            path: [],
          },
        ],
        message: 'Must conform a union',
        meta: undefined,
      },
    ]);
  });

  test('raises issues from the first failure asynchronously', async () => {
    const elementShape1 = numberShape.transformAsync(value => Promise.resolve(value + ''));
    const elementShape2 = stringShape.transformAsync(value => Promise.resolve(value + ''));

    expect(await new UnionShape([elementShape1, elementShape2]).validateAsync(true)).toEqual([
      {
        code: 'union',
        path: [],
        input: true,
        param: [
          {
            code: 'type',
            path: [],
            input: true,
            param: 'number',
            message: 'Must be a number',
            meta: undefined,
          },
        ],
        message: 'Must conform a union',
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
