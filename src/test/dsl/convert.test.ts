import * as d from '../../main';

describe('convert', () => {
  test('returns a shape', () => {
    expect(d.convert(() => 111)).toBeInstanceOf(d.ConvertShape);
  });

  test('converts an input value', () => {
    expect(d.convert(input => input + 111).parse(222)).toBe(333);
  });
});
