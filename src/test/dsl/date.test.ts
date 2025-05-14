import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('date', () => {
  test('returns a shape', () => {
    expect(d.date()).toBeInstanceOf(d.DateShape);
  });
});
