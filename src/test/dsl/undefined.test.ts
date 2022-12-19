import * as d from '../../main';

describe('undefined', () => {
  test('returns an const shape', () => {
    const shape = d.undefined();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBe(undefined);
  });
});
