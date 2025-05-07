import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('null', () => {
  test('returns a const shape', () => {
    const shape = d.null();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBeNull();
  });
});
