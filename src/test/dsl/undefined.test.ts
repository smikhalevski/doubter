import * as d from '../../main';

describe('undefined', () => {
  test('returns a const shape', () => {
    const shape = d.undefined();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBeUndefined();
  });
});
