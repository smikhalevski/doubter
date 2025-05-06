import { describe, expect, test } from 'vitest';
import * as d from '../../main';

describe('nan', () => {
  test('returns a const shape', () => {
    const shape = d.nan();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBe(NaN);
  });
});
