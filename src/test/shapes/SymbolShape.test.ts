import { Shape, SymbolShape } from '../../main';
import { CODE_TYPE } from '../../main/constants';
import { TYPE_SYMBOL } from '../../main/types';

describe('SymbolShape', () => {
  test('creates a SymbolShape', () => {
    const shape = new SymbolShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_SYMBOL]);
  });

  test('parses symbol values', () => {
    const input = Symbol();

    expect(new SymbolShape().parse(input)).toBe(input);
  });

  test('raises an issue if an input is not a symbol', () => {
    expect(new SymbolShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_SYMBOL, message: Shape.messages['type.symbol'] }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new SymbolShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_SYMBOL, message: 'aaa', meta: 'bbb' }],
    });
  });
});
