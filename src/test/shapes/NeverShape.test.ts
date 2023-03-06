import { NeverShape } from '../../main';
import { CODE_TYPE, MESSAGE_NEVER_TYPE, TYPE_ANY, TYPE_NEVER, TYPE_STRING } from '../../main/constants';

describe('NeverShape', () => {
  test('has the never input type', () => {
    expect(new NeverShape().inputTypes).toEqual([TYPE_NEVER]);
  });

  test('always raises an issue', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_NEVER_TYPE, param: TYPE_NEVER }],
    });
  });

  test('accepts never', () => {
    expect(new NeverShape().isAcceptedType(TYPE_NEVER)).toBe(true);
  });

  test('does not accept any', () => {
    expect(new NeverShape().isAcceptedType(TYPE_ANY)).toBe(false);
  });

  test('does not accept other types', () => {
    expect(new NeverShape().isAcceptedType(TYPE_STRING)).toBe(false);
  });
});
