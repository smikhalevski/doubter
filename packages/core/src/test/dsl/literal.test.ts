import { literal } from '../../main';

describe('literal', () => {
  test('raises if value is not a literal', () => {
    expect(literal(111).validate('aaa')).toEqual([
      {
        code: 'literal',
        path: [],
        input: 'aaa',
        param: 111,
      },
    ]);
  });

  test('allows a literal', () => {
    expect(literal(111).validate(111)).toEqual([]);
  });
});
