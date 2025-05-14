import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.js';

describe('symbol', () => {
  test('returns a symbol shape', () => {
    expect(d.symbol()).toBeInstanceOf(d.SymbolShape);
  });
});
