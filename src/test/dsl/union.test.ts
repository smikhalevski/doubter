import * as d from '../../main';

describe('union', () => {
  test('infers type', () => {
    const output: { foo: string | number } = d
      .union([d.object({ foo: d.string() }), d.object({ foo: d.number() })])
      .parse({ foo: 'aaa' });
  });

  test('returns an boolean shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape.inputTypes).toEqual(['string', 'number']);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
