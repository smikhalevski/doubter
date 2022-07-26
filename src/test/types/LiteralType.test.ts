import { LiteralType } from '../../main';

describe('LiteralType', () => {
  test('allows a literal', () => {
    expect(new LiteralType(111).validate(111)).toBe(null);
  });

  test('raises if value is not a literal', () => {
    expect(new LiteralType(111).validate('aaa')).toEqual([
      {
        code: 'literal',
        path: [],
        input: 'aaa',
        param: 111,
        message: 'Must be exactly equal to 111',
        meta: undefined,
      },
    ]);
  });
});
