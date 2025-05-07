import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('const', () => {
  test('returns a const shape', () => {
    const shape = d.const(111);

    expect(shape).toBeInstanceOf(d.ConstShape);
  });
});
