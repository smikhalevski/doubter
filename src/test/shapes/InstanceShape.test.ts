import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/constants';
import { ARRAY, DATE, FUNCTION, MAP, OBJECT, SET } from '../../main/utils/type-system';

describe('InstanceShape', () => {
  class MockClass {}

  test('creates an InstanceShape', () => {
    const shape = new InstanceShape(MockClass);

    expect(shape.ctor).toBe(MockClass);
    expect(shape.inputTypes).toEqual([OBJECT]);
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
      expect(new InstanceShape(Function).inputTypes).toEqual([FUNCTION]);
      expect(new InstanceShape(class extends Function {}).inputTypes).toEqual([FUNCTION]);
    });

    test('uses array input type for an Array and its subclasses', () => {
      expect(new InstanceShape(Array).inputTypes).toEqual([ARRAY]);
      expect(new InstanceShape(class extends Array {}).inputTypes).toEqual([ARRAY]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Date).inputTypes).toEqual([DATE]);
      expect(new InstanceShape(class extends Date {}).inputTypes).toEqual([DATE]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Set).inputTypes).toEqual([SET]);
      expect(new InstanceShape(class extends Set {}).inputTypes).toEqual([SET]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Map).inputTypes).toEqual([MAP]);
      expect(new InstanceShape(class extends Map {}).inputTypes).toEqual([MAP]);
    });
  });
});
