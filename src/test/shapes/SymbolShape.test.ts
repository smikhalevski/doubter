import { SymbolShape } from '../../main';
import { CODE_TYPE, MESSAGE_SYMBOL_TYPE } from '../../main/constants';
import { SYMBOL } from '../../main/utils/type-system';

describe('SymbolShape', () => {
  test('parses symbol values', () => {
    const value = Symbol();
    expect(new SymbolShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a symbol', () => {
    expect(new SymbolShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: SYMBOL, message: MESSAGE_SYMBOL_TYPE }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new SymbolShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: SYMBOL, message: 'aaa', meta: 'bbb' }],
    });
  });
});
