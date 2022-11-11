import * as d from '../../main';
import { CODE_TYPE, MESSAGE_NUMBER_TYPE, TYPE_NUMBER } from '../../main/constants';

describe('number', () => {
  test('returns an number shape', () => {
    expect(d.number()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not an number', () => {
    expect(d.number().try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: 'aaa',
          message: MESSAGE_NUMBER_TYPE,
          param: TYPE_NUMBER,
          path: [],
        },
      ],
    });
  });
});
