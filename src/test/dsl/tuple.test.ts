import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('tuple', () => {
  test('returns an array shape', () => {
    expect(d.tuple([d.number()])).toBeInstanceOf(d.ArrayShape);
  });
});
