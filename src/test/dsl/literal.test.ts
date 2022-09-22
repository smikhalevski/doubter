import { literal, LiteralShape } from '../../main';

describe('literal', () => {
  test('returns an literal shape', () => {
    expect(literal(111)).toBeInstanceOf(LiteralShape);
  });
});
