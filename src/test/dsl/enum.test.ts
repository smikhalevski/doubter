import * as d from '../../main';

describe('enum', () => {
  test('returns an enum shape', () => {
    const shape = d.enum([111, 222]);

    expect(shape).toBeInstanceOf(d.EnumShape);
    expect(shape.inputValues).toEqual([111, 222]);
  });
});
