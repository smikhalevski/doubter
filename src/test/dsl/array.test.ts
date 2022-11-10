import * as d from '../../main';

describe('array', () => {
  test('returns an unconstrained array shape', () => {
    const arrShape = d.array();

    expect(arrShape.shapes).toBe(null);
    expect(arrShape.restShape).toBe(null);
  });

  test('returns an array shape', () => {
    const shape1 = d.number();
    const arrShape = d.array(shape1);

    expect(arrShape.shapes).toBe(null);
    expect(arrShape.restShape).toBe(shape1);
  });
});
