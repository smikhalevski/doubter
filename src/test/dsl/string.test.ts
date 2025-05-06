import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { Type } from '../../main/Type';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns inputs for optional string', () => {
    expect(d.string().optional().inputs).toEqual([Type.STRING, undefined]);
  });
});
