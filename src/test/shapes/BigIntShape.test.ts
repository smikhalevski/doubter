import { BigIntShape } from '../../main';
import { CODE_TYPE, TYPE_BIGINT } from '../../main/constants';

describe('BigIntShape', () => {
  test('allows a bigint', () => {
    expect(new BigIntShape().validate(BigInt(111))).toBe(null);
  });

  test('raises if value is not a bigint', () => {
    expect(new BigIntShape().validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_BIGINT,
        message: 'Must be a bigint',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new BigIntShape({ message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_BIGINT,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
