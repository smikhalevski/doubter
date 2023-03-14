import { NeverShape } from '../../main';
import { CODE_NEVER, MESSAGE_NEVER } from '../../main/constants';

describe('NeverShape', () => {
  test('has the never input type', () => {
    expect(new NeverShape().inputs).toEqual([]);
  });

  test('always raises an issue', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_NEVER, input: 111, message: MESSAGE_NEVER, param: null }],
    });
  });
});
