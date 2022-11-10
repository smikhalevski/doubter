import * as d from '../../main';

describe('tuple', () => {
  test('infers type', () => {
    const output: [string, number] = d.tuple([d.string(), d.number()]).parse(['aaa', 111]);
  });

  test('returns an array shape', () => {
    expect(d.tuple([d.number()])).toBeInstanceOf(d.ArrayShape);
  });
});
