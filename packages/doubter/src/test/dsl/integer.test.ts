import * as d from '../../main';
import { CODE_TYPE, MESSAGE_INTEGER_TYPE, TYPE_INTEGER } from '../../main/constants';

describe('integer', () => {
  test('returns an integer shape', () => {
    expect(d.integer()).toBeInstanceOf(d.NumberShape);
    expect(d.int()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not an integer', () => {
    expect(d.integer().try(0.5)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: 0.5,
          message: MESSAGE_INTEGER_TYPE,
          param: TYPE_INTEGER,
          path: [],
        },
      ],
    });
  });
});
