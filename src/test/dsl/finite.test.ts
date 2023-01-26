import * as d from '../../main';
import { CODE_NUMBER_FINITE, MESSAGE_NUMBER_FINITE } from '../../main/constants';

describe('finite', () => {
  test('returns a number shape', () => {
    expect(d.finite()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not a finite number', () => {
    expect(d.finite().try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_NUMBER_FINITE,
          input: 'aaa',
          message: MESSAGE_NUMBER_FINITE,
          param: undefined,
          path: [],
        },
      ],
    });
  });
});
