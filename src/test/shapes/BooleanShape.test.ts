import { BooleanShape } from '../../main';
import { CODE_TYPE, TYPE_BOOLEAN } from '../../main/constants';

describe('BooleanShape', () => {
  test('allows a boolean', () => {
    expect(new BooleanShape().parse(true)).toBe(true);
  });

  test('raises if value is not a boolean', () => {
    expect(new BooleanShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BOOLEAN, message: 'Must be a boolean' }],
    });
  });

  test('overrides message for type issue', () => {
    expect(new BooleanShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_BOOLEAN, message: 'aaa', meta: 'bbb' }],
    });
  });
});
