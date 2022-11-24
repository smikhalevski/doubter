import * as d from '../../main';

describe('any', () => {
  test('returns a shape', () => {
    expect(d.any()).toBeInstanceOf(d.Shape);
  });

  test('returns a shape with a refinement', () => {
    const cb = () => true;

    expect(d.any(cb).checks[0].param).toBe(cb);
  });
});
