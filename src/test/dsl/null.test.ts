import * as d from '../../main';

describe('null', () => {
  test('returns an const shape', () => {
    const shape = d.null();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBe(null);
  });
});
