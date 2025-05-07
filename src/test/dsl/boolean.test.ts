import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('boolean', () => {
  test('returns a boolean shape', () => {
    expect(d.boolean()).toBeInstanceOf(d.BooleanShape);
  });
});
