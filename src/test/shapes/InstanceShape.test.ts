import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/constants';
import { TYPE_ARRAY, TYPE_DATE, TYPE_FUNCTION, TYPE_MAP, TYPE_OBJECT, TYPE_SET } from '../../main/Type';

describe('InstanceShape', () => {
  class MockClass {}

  test('creates an InstanceShape', () => {
    const shape = new InstanceShape(MockClass);

    expect(shape.ctor).toBe(MockClass);
    expect(shape.inputs).toEqual([TYPE_OBJECT]);
  });

  test('parses an instance of a class', () => {
    const value = new MockClass();

    expect(new InstanceShape(MockClass).parse(value)).toBe(value);
  });

  test('raises an issue if an input is not an instance of the class', () => {
    expect(new InstanceShape(MockClass).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, input: {}, param: MockClass, message: 'Must be a class instance' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new InstanceShape(MockClass, { message: 'aaa', meta: 'bbb' }).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, input: {}, param: MockClass, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('inputs', () => {
    test('uses array input type for an Function and its subclasses', () => {
      expect(new InstanceShape(Function).inputs).toEqual([TYPE_FUNCTION]);
      expect(new InstanceShape(class extends Function {}).inputs).toEqual([TYPE_FUNCTION]);
    });

    test('uses array input type for an Array and its subclasses', () => {
      expect(new InstanceShape(Array).inputs).toEqual([TYPE_ARRAY]);
      expect(new InstanceShape(class extends Array {}).inputs).toEqual([TYPE_ARRAY]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Date).inputs).toEqual([TYPE_DATE]);
      expect(new InstanceShape(class extends Date {}).inputs).toEqual([TYPE_DATE]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Set).inputs).toEqual([TYPE_SET]);
      expect(new InstanceShape(class extends Set {}).inputs).toEqual([TYPE_SET]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Map).inputs).toEqual([TYPE_MAP]);
      expect(new InstanceShape(class extends Map {}).inputs).toEqual([TYPE_MAP]);
    });
  });
});
