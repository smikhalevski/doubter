import * as d from '../../main';

describe('const', () => {
  test('infers type', () => {
    const value: 111 = d.const(111).parse(111);
  });

  test('returns an enum shape', () => {
    const shape = d.const(111);

    expect(shape).toBeInstanceOf(d.EnumShape);
    expect(shape.values).toEqual([111]);
  });
});
