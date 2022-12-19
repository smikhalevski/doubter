import * as d from '../../main';

describe('nan', () => {
  test('returns an const shape', () => {
    const shape = d.nan();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBe(NaN);
  });
});
