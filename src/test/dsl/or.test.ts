import * as d from '../../main';

describe('or', () => {
  test('infers type', () => {
    const output: number | string = d.or([d.number(), d.string()]).parse(111);
  });

  test('returns an union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });
});
