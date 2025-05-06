import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { Shape } from '../../main';

describe('array', () => {
  test('returns an unconstrained array shape', () => {
    const shape = d.array();

    expect(shape).toBeInstanceOf(d.ArrayShape);
    expect(shape.headShapes.length).toBe(0);
    expect(shape.restShape).toEqual(new Shape());
  });

  test('returns an array shape with elements constrained by a rest shape', () => {
    const restShape = d.number();
    const shape = d.array(restShape);

    expect(shape.headShapes.length).toBe(0);
    expect(shape.restShape).toBe(restShape);
  });
});
