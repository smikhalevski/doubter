import { number, tuple, TupleType } from '../../main';

describe('tuple', () => {
  test('returns an tuple type', () => {
    expect(tuple([number()])).toBeInstanceOf(TupleType);
  });
});
