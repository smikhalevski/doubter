import * as d from '../../main';
import { CODE_TYPE, MESSAGE_EMAIL, TYPE_EMAIL } from '../../main/constants';

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
          code: CODE_TYPE,
          input: 'aaa@',
          message: MESSAGE_EMAIL,
          param: TYPE_EMAIL,
          path: [],
        },
      ],
    });
  });
});
