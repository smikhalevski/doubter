import { describe, expect, test } from 'vitest';
import * as d from '../../main';

describe('map', () => {
  test('returns a Map shape', () => {
    expect(d.map(d.string(), d.number())).toBeInstanceOf(d.MapShape);
  });
});
