import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { ArrayShape, StringShape } from '../../main';
import { CODE_TYPE_FUNCTION } from '../../main/constants';

describe('function', () => {
  test('returns a function shape', () => {
    expect(d.fn()).toBeInstanceOf(d.FunctionShape);
    expect(d.function()).toBeInstanceOf(d.FunctionShape);
  });

  test('unconstrained arguments by default', () => {
    const shape = d.fn();

    expect(shape.argsShape).toBeInstanceOf(ArrayShape);
    expect(shape.argsShape.headShapes.length).toBe(0);
  });

  test('wraps arguments into an array shape', () => {
    const shape = d.fn([d.string()]);

    expect(shape.argsShape.headShapes.length).toBe(1);
    expect(shape.argsShape.headShapes[0]).toBeInstanceOf(StringShape);
  });

  test('recognizes options as the first argument', () => {
    const shape = d.fn({ message: 'aaa' });

    expect(shape.argsShape).toBeInstanceOf(ArrayShape);
    expect(shape.argsShape.headShapes.length).toBe(0);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_FUNCTION, input: 111, message: 'aaa' }],
    });
  });
});
