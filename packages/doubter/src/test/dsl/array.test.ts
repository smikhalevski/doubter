import * as d from '../../main';

describe('array', () => {
  test('returns an unconstrained array shape', () => {
    const arrShape = d.array();

    expect(arrShape.shapes).toBe(null);
    expect(arrShape.restShape).toBe(null);
  });

  test('returns an array shape with elements constrained by a rest shape', () => {
    const restShape = d.number();
    const arrShape = d.array(restShape);

    expect(arrShape.shapes).toBe(null);
    expect(arrShape.restShape).toBe(restShape);
  });
});
