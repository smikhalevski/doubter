import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';
import { CODE_TYPE_NUMBER, MESSAGE_TYPE_NUMBER } from '../../main/constants.ts';

describe('number', () => {
  test('returns a number shape', () => {
    expect(d.number()).toBeInstanceOf(d.NumberShape);
  });

  test('raises an issue if value is not a number', () => {
    expect(d.number().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_NUMBER, input: 'aaa', message: MESSAGE_TYPE_NUMBER }],
    });
  });
});
