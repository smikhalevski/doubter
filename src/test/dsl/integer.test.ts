import * as d from '../../main';
import { CODE_NUMBER_INTEGER, MESSAGE_NUMBER_INTEGER } from '../../main/constants';

describe('integer', () => {
  test('returns a number shape', () => {
    expect(d.integer()).toBeInstanceOf(d.NumberShape);
    expect(d.int()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not an integer', () => {
    expect(d.integer().parse(5)).toBe(5);

    expect(d.integer().try(0.5)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_INTEGER, input: 0.5, message: MESSAGE_NUMBER_INTEGER, param: undefined }],
    });
  });
});
