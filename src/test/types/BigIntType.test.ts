import { BigIntType } from '../../main';

describe('BigIntType', () => {
  test('allows a bigint', () => {
    expect(new BigIntType().validate(BigInt(111))).toBe(null);
  });

  test('raises if value is not a bigint', () => {
    expect(new BigIntType().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'bigint',
        message: 'Must be a bigint',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new BigIntType({ message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'bigint',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
