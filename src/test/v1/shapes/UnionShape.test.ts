import { ArrayShape, NumberShape, StringShape, UnionShape } from '../../../main';

describe('UnionShape', () => {
  test('returns the input as is', () => {
    expect(new UnionShape([new NumberShape(), new StringShape()]).parse('aaa')).toBe('aaa');
  });

  test('raises issues from the first failure', () => {
    expect(new UnionShape([new NumberShape(), new StringShape()]).validate(true)).toEqual([
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

  test('raises issues from the first failure asynchronously', async () => {
    const elementShape1 = new NumberShape().transformAsync(value => Promise.resolve(value + ''));
    const elementShape2 = new StringShape().transformAsync(value => Promise.resolve(value + ''));
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
    const elementShape1 = new NumberShape();
    const elementShape2 = new StringShape();
    const shape = new UnionShape([new ArrayShape(elementShape1), new ArrayShape(elementShape2)]);

    expect(shape.at(0)).toStrictEqual(new UnionShape([elementShape1, elementShape2]));
    expect(shape.at('aaa')).toBe(null);
  });

  test('returns child type at key excluding nulls', () => {
    const elementShape = new NumberShape();
    const shape = new UnionShape([new ArrayShape(elementShape), new StringShape()]);

    expect(shape.at(0)).toStrictEqual(elementShape);
    expect(shape.at(1)).toStrictEqual(elementShape);
  });
});
