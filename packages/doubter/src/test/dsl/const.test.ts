import * as d from '../../main';
import { CODE_ENUM } from '../../main/constants';

describe('const', () => {
  test('returns an enum shape', () => {
    expect(d.const(111)).toBeInstanceOf(d.EnumShape);
  });

  test('raises issue if value does not match const', () => {
    expect(d.const(111).try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          input: 'aaa',
          message: 'Must be equal to one of: 111',
          param: [111],
          path: [],
        },
      ],
    });
  });
});
