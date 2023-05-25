import { Shape } from '../../main';
import * as d from '../../main';

describe('array', () => {
  test('returns an unconstrained array shape', () => {
    const arrShape = d.array();

    expect(arrShape).toBeInstanceOf(d.ArrayShape);
    expect(arrShape.headShapes.length).toBe(0);
    expect(arrShape.restShape).toEqual(new Shape());
  });

  test('returns an array shape with elements constrained by a rest shape', () => {
    const restShape = d.number();
    const arrShape = d.array(restShape);

    expect(arrShape.headShapes.length).toBe(0);
    expect(arrShape.restShape).toBe(restShape);
  });
});
