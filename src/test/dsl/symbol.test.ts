import * as d from '../../main';

describe('symbol', () => {
  test('returns a symbol shape', () => {
    expect(d.symbol()).toBeInstanceOf(d.SymbolShape);
  });
});
