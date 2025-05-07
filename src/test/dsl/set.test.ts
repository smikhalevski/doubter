import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('set', () => {
  test('returns a Set shape', () => {
    const valueShape = d.number();
    const shape = d.set(valueShape);

    expect(shape.valueShape).toBe(valueShape);
  });
});
