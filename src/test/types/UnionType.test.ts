import { ArrayType, NumberType, StringType, UnionType } from '../../main';

describe('UnionType', () => {
  test('returns the input as is', () => {
    expect(new UnionType([new NumberType(), new StringType()]).parse('aaa')).toBe('aaa');
  });

  test('raises issues from the last failure', () => {
    expect(new UnionType([new NumberType(), new StringType()]).validate(true)).toEqual([
      {
        code: 'union',
        path: [],
        input: true,
        param: [
          {
            code: 'type',
            path: [],
            input: true,
            param: 'string',
            message: 'Must be a string',
            meta: undefined,
          },
        ],
        message: 'Must conform a union',
        meta: undefined,
      },
    ]);
  });

  test('returns child type at key', () => {
    const childType1 = new NumberType();
    const childType2 = new StringType();
    const type = new UnionType([new ArrayType(childType1), new ArrayType(childType2)]);

    expect(type.at(0)).toStrictEqual(new UnionType([childType1, childType2]));
    expect(type.at('aaa')).toBe(null);
  });

  test('returns child type at key excluding nulls', () => {
    const childType = new NumberType();
    const type = new UnionType([new ArrayType(childType), new StringType()]);

    expect(type.at(0)).toStrictEqual(childType);
  });
});
