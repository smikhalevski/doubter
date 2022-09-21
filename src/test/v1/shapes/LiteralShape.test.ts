import { LiteralShape } from '../../../main';
import { CODE_LITERAL, MESSAGE_LITERAL } from '../../../main/v1/shapes/constants';

describe('LiteralShape', () => {
  test('allows a literal', () => {
    expect(new LiteralShape(111).validate(111)).toBe(null);
  });

  test('raises if value is not a literal', () => {
    expect(new LiteralShape(111).validate('aaa')).toEqual([
      {
        code: CODE_LITERAL,
        path: [],
        input: 'aaa',
        param: 111,
        message: MESSAGE_LITERAL + 111,
        meta: undefined,
      },
    ]);
  });
});
