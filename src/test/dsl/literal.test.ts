import { literal, LiteralType } from '../../main';

describe('literal', () => {
  test('returns an literal type', () => {
    expect(literal(111)).toBeInstanceOf(LiteralType);
  });
});
