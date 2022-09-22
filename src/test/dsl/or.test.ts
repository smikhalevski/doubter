import { number, or, string, UnionShape } from '../../main';

describe('or', () => {
  test('infers type', () => {
    const output: number | string = or([number(), string()]).parse(111);
  });

  test('returns an union shape', () => {
    expect(or([number()])).toBeInstanceOf(UnionShape);
  });
});
