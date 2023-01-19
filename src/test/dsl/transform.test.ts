import * as d from '../../main';

describe('transform', () => {
  test('returns a shape', () => {
    expect(d.transform(() => 111)).toBeInstanceOf(d.TransformShape);
  });

  test('transforms an input value', () => {
    expect(d.transform(input => input + 111).parse(222)).toBe(333);
  });
});
