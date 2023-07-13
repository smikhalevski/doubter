import * as d from '../../main';
import { CODE_TYPE, MESSAGE_TYPE_NUMBER } from '../../main/constants';
import { TYPE_NUMBER } from '../../main/Type';

describe('number', () => {
  test('returns a number shape', () => {
    expect(d.number()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not a number', () => {
    expect(d.number().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_TYPE_NUMBER, param: TYPE_NUMBER }],
    });
  });
});
