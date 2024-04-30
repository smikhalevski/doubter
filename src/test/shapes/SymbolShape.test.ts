import { SymbolShape } from '../../main';
import { CODE_TYPE, MESSAGE_TYPE_SYMBOL } from '../../main/constants';
import { Type } from '../../main/Type';

describe('SymbolShape', () => {
  test('creates a SymbolShape', () => {
    const shape = new SymbolShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.SYMBOL]);
  });

  test('parses symbol values', () => {
    const input = Symbol();

    expect(new SymbolShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a symbol', () => {
    expect(new SymbolShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: Type.SYMBOL, message: MESSAGE_TYPE_SYMBOL }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new SymbolShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: Type.SYMBOL, message: 'aaa', meta: 'bbb' }],
    });
  });
});
