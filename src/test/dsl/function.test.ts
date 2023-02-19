import * as d from '../../main';
import { ArrayShape, StringShape } from '../../main';
import { CODE_TYPE, TYPE_FUNCTION } from '../../main/constants';

describe('function', () => {
  test('returns a shape', () => {
    expect(d.fn()).toBeInstanceOf(d.FunctionShape);
    expect(d.function()).toBeInstanceOf(d.FunctionShape);
  });

  test('unconstrained arguments by default', () => {
    const shape = d.fn();

    expect(shape.argsShape).toBeInstanceOf(ArrayShape);
    expect(shape.argsShape.shapes.length).toBe(0);
  });

  test('wraps arguments into an array shape', () => {
    const shape = d.fn([d.string()]);

    expect(shape.argsShape.shapes.length).toBe(1);
    expect(shape.argsShape.shapes[0]).toBeInstanceOf(StringShape);
  });

  test('recognizes options as the first argument', () => {
    const shape = d.fn({ message: 'aaa' });

    expect(shape.argsShape).toBeInstanceOf(ArrayShape);
    expect(shape.argsShape.shapes.length).toBe(0);

    expect(shape.try(111)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: 111,
          message: 'aaa',
          param: TYPE_FUNCTION,
          path: [],
        },
      ],
    });
  });
});
