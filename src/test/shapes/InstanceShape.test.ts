import { InstanceShape } from '../../main';
import {
  CODE_INSTANCE,
  TYPE_ARRAY,
  TYPE_DATE,
  TYPE_FUNCTION,
  TYPE_MAP,
  TYPE_OBJECT,
  TYPE_SET,
} from '../../main/constants';

describe('InstanceShape', () => {
  class MockClass {}

  test('creates an InstanceShape', () => {
    const shape = new InstanceShape(MockClass);

    expect(shape.ctor).toBe(MockClass);
    expect(shape.inputTypes).toEqual([TYPE_OBJECT]);
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

  describe('inputTypes', () => {
    test('uses array input type for an Function and its subclasses', () => {
      expect(new InstanceShape(Function).inputTypes).toEqual([TYPE_FUNCTION]);
      expect(new InstanceShape(class extends Function {}).inputTypes).toEqual([TYPE_FUNCTION]);
    });

    test('uses array input type for an Array and its subclasses', () => {
      expect(new InstanceShape(Array).inputTypes).toEqual([TYPE_ARRAY]);
      expect(new InstanceShape(class extends Array {}).inputTypes).toEqual([TYPE_ARRAY]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Date).inputTypes).toEqual([TYPE_DATE]);
      expect(new InstanceShape(class extends Date {}).inputTypes).toEqual([TYPE_DATE]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Set).inputTypes).toEqual([TYPE_SET]);
      expect(new InstanceShape(class extends Set {}).inputTypes).toEqual([TYPE_SET]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Map).inputTypes).toEqual([TYPE_MAP]);
      expect(new InstanceShape(class extends Map {}).inputTypes).toEqual([TYPE_MAP]);
    });
  });
});
