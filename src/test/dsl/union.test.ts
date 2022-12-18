import * as d from '../../main';

describe('union', () => {
  test('returns an boolean shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape['_inputTypes']).toEqual(['string', 'number']);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
