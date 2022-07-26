import { NumberType, StringType, UnionType } from '../../main';

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
});
