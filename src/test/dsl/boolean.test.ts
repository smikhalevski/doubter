import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('boolean', () => {
  test('returns a boolean shape', () => {
    expect(d.boolean()).toBeInstanceOf(d.BooleanShape);
  });
});
