import { BooleanShape, Shape } from '../../main';
import { CODE_TYPE } from '../../main/constants';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_OBJECT } from '../../main/Type';

describe('BooleanShape', () => {
  test('creates a BooleanShape', () => {
    const shape = new BooleanShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_BOOLEAN]);
  });

  test('parses boolean values', () => {
    expect(new BooleanShape().parse(true)).toBe(true);
  });

  test('raises an issue if an input is not a boolean', () => {
    expect(new BooleanShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: TYPE_BOOLEAN, message: Shape.messages['type.boolean'] }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BooleanShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_BOOLEAN, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      const shape = new BooleanShape().coerce();

      expect(shape.inputs).toEqual([TYPE_ARRAY, TYPE_OBJECT, TYPE_BOOLEAN, 'false', 'true', 0, 1, null, undefined]);
    });

    test('coerces an input', () => {
      expect(new BooleanShape().coerce().parse(1)).toBe(true);
      expect(new BooleanShape().coerce().parse(new Boolean(true))).toBe(true);
      expect(new BooleanShape().coerce().parse([new Boolean(true)])).toBe(true);
      expect(new BooleanShape().coerce().parse('true')).toBe(true);
      expect(new BooleanShape().parse('true', { coerce: true })).toBe(true);
    });

    test('raises an issue if coercion fails', () => {
      expect(new BooleanShape().coerce().try(222)).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 222, message: Shape.messages['type.boolean'], param: TYPE_BOOLEAN }],
      });
    });
  });
});
