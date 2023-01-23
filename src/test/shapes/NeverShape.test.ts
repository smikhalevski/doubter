import { NeverShape } from '../../main';
import { CODE_TYPE, MESSAGE_NEVER_TYPE, TYPE_NEVER } from '../../main/constants';

describe('NeverShape', () => {
  test('always raises an issue', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, message: MESSAGE_NEVER_TYPE, param: TYPE_NEVER }],
    });
  });
});
