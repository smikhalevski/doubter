import * as d from '../../main';

describe('not', () => {
  test('returns an exclusion shape', () => {
    const excludedShape = d.string();
    const shape = d.not(excludedShape);

    expect(shape).toBeInstanceOf(d.ExcludeShape);
    expect(shape.excludedShape).toBe(excludedShape);
  });
});
