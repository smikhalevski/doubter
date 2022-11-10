import * as d from '../../main';
import { CODE_STRING_REGEX, MESSAGE_EMAIL } from '../../main/constants';

describe('email', () => {
  test('returns a string shape', () => {
    expect(d.email()).toBeInstanceOf(d.StringShape);
  });

  test('raises issue if value not a valid email', () => {
    expect(d.email().parse('aaa@bbb.ccc')).toBe('aaa@bbb.ccc');

    expect(d.email().try('aaa@')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_REGEX,
          input: 'aaa@',
          message: MESSAGE_EMAIL,
          param: expect.any(RegExp),
          path: [],
        },
      ],
    });
  });
});
