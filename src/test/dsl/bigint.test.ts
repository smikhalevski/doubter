import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('bigint', () => {
  test('returns a bigint shape', () => {
    expect(d.bigint()).toBeInstanceOf(d.BigIntShape);
  });
});
