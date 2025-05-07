import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('symbol', () => {
  test('returns a symbol shape', () => {
    expect(d.symbol()).toBeInstanceOf(d.SymbolShape);
  });
});
