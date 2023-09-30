import { NeverShape, Shape } from '../../main';
import { CODE_TYPE_NEVER } from '../../main/constants';

describe('NeverShape', () => {
  test('has empty inputs', () => {
    expect(new NeverShape().inputs).toEqual([]);
  });

  test('always raises an issue', () => {
    expect(new NeverShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_NEVER, input: 111, message: Shape.messages[CODE_TYPE_NEVER], param: undefined }],
    });
  });
});
