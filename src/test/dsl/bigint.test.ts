import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('bigint', () => {
  test('returns a bigint shape', () => {
    expect(d.bigint()).toBeInstanceOf(d.BigIntShape);
  });
});
