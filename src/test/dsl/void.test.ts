import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('void', () => {
  test('returns a const shape', () => {
    const shape = d.void();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBeUndefined();
  });
});
