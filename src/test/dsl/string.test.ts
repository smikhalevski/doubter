import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';
import { Type } from '../../main/Type.js';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns inputs for optional string', () => {
    expect(d.string().optional().inputs).toEqual([Type.STRING, undefined]);
  });
});
