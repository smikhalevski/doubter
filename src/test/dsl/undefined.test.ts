import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('undefined', () => {
  test('returns a const shape', () => {
    const shape = d.undefined();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBeUndefined();
  });
});
