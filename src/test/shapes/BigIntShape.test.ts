import { BigIntShape } from '../../main';
import { CODE_TYPE, TYPE_BIGINT } from '../../main/constants';

describe('BigIntShape', () => {
  test('parses bigint values', () => {
    const value = BigInt(111);

    expect(new BigIntShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a bigint', () => {
    expect(new BigIntShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BIGINT, message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_BIGINT, message: 'aaa', meta: 'bbb' }],
    });
  });
});
