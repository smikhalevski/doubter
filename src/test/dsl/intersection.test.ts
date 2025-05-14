import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('intersection', () => {
  test('returns an intersection shape', () => {
    expect(d.intersection([d.string(), d.number()])).toBeInstanceOf(d.IntersectionShape);
    expect(d.and([d.string(), d.number()])).toBeInstanceOf(d.IntersectionShape);
  });
});
