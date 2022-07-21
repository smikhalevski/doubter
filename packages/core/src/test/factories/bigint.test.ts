import { bigint } from '../../main';

describe('bigint', () => {
  test('raises if value is not a bigint', () => {
    expect(bigint().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'bigint',
      },
    ]);
  });

  test('allows a bigint', () => {
    expect(bigint().validate(BigInt(111))).toEqual([]);
  });
});
