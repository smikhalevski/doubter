import { describe, expect, test } from 'vitest';
import { SymbolShape } from '../../main/index.ts';
import { CODE_TYPE_SYMBOL, MESSAGE_TYPE_SYMBOL } from '../../main/constants.ts';
import { Type } from '../../main/Type.ts';

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
      issues: [{ code: CODE_TYPE_SYMBOL, input: 'aaa', message: MESSAGE_TYPE_SYMBOL }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new SymbolShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_SYMBOL, input: 111, message: 'aaa', meta: 'bbb' }],
    });
  });
});
