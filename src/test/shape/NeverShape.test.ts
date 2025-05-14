import { describe, expect, test } from 'vitest';
import { NeverShape } from '../../main/index.js';
import { CODE_TYPE_NEVER, MESSAGE_TYPE_NEVER } from '../../main/constants.js';

describe('NeverShape', () => {
  test('has empty inputs', () => {
    expect(new NeverShape().inputs).toEqual([]);
  });

  test('always raises an issue', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_NEVER, input: 111, message: MESSAGE_TYPE_NEVER, param: undefined }],
    });
  });
});
