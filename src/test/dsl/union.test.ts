import * as d from '../../main';

describe('union', () => {
  test('returns a union shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape['_getInputTypes']()).toEqual(['string', 'number']);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
