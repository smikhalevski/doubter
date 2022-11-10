import * as d from '../../main';
import { CODE_STRING_REGEX, MESSAGE_CUID } from '../../main/constants';

describe('cuid', () => {
  test('returns a string shape', () => {
    expect(d.cuid()).toBeInstanceOf(d.StringShape);
  });

  test('raises issue if value is not a valid CUID', () => {
    expect(d.cuid().parse('cjld2cyuq0000t3rmniod1foy')).toBe('cjld2cyuq0000t3rmniod1foy');

    expect(d.cuid().try('asdfghjnm')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_STRING_REGEX,
          input: 'asdfghjnm',
          message: MESSAGE_CUID,
          param: expect.any(RegExp),
          path: [],
        },
      ],
    });
  });
});
