import { number, string, union, UnionShape } from '../../main';

describe('or', () => {
  test('infers type', () => {
    const output: number | string = union([number(), string()]).parse(111);
  });

  test('returns an union shape', () => {
    expect(union([number()])).toBeInstanceOf(UnionShape);
  });
});
