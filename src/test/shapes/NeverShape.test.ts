import { NeverShape } from '../../main';
import { CODE_NEVER } from '../../main/constants';

describe('NeverShape', () => {
  test('always raises', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_NEVER, path: [], input: 111, message: 'Must not be used' }],
    });
  });
});
