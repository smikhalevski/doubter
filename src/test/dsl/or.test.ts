import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';
import { Type } from '../../main/Type.js';

describe('or', () => {
  test('returns a union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });

  test('unknown absorbs other types in a union', () => {
    expect(d.or([d.string(), d.any()]).inputs).toEqual([Type.UNKNOWN]);
  });
});
