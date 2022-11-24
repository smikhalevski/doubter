import * as d from '../../main';

describe('const', () => {
  test('returns an enum shape', () => {
    const shape = d.const(111);

    expect(shape).toBeInstanceOf(d.EnumShape);
    expect(shape.values).toEqual([111]);
  });
});
