import { BooleanShape, Shape } from '../../main';
import { booleanCoercibleInputs } from '../../main/coerce/boolean';
import { CODE_TYPE } from '../../main/constants';
import { Type } from '../../main/Type';

describe('BooleanShape', () => {
  test('creates a BooleanShape', () => {
    const shape = new BooleanShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.BOOLEAN]);
  });

  test('parses boolean values', () => {
    expect(new BooleanShape().parse(true)).toBe(true);
  });

  test('raises an issue if an input is not a boolean', () => {
    expect(new BooleanShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', param: Type.BOOLEAN, message: Shape.messages['type.boolean'] }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BooleanShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: Type.BOOLEAN, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('coerce', () => {
    test('extends shape inputs', () => {
      expect(new BooleanShape().coerce().inputs).toBe(booleanCoercibleInputs);
    });

    test('coerces an input', () => {
      expect(new BooleanShape().coerce().parse(1)).toBe(true);
      expect(new BooleanShape().coerce().parse(new Boolean(true))).toBe(true);
      expect(new BooleanShape().coerce().parse([new Boolean(true)])).toBe(true);
      expect(new BooleanShape().coerce().parse('true')).toBe(true);
    });

    test('raises an issue if coercion fails', () => {
      expect(new BooleanShape().coerce().try(222)).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 222, message: Shape.messages['type.boolean'], param: Type.BOOLEAN }],
      });
    });
  });

  describe('async', () => {
    test('invokes async check', async () => {
      const checkMock = jest.fn(() => Promise.resolve([{ code: 'xxx' }]));

      const shape = new BooleanShape().checkAsync(checkMock);

      expect(shape.isAsync).toBe(true);

      await expect(shape.tryAsync(true)).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});
