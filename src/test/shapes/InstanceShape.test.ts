import { InstanceShape } from '../../main';
import { CODE_TYPE_INSTANCE_OF } from '../../main/constants';
import { TYPE_ARRAY, TYPE_DATE, TYPE_FUNCTION, TYPE_MAP, TYPE_OBJECT, TYPE_PROMISE, TYPE_SET } from '../../main/types';

describe('InstanceShape', () => {
  class TestClass {}

  test('creates an InstanceShape', () => {
    const shape = new InstanceShape(TestClass);

    expect(shape.ctor).toBe(TestClass);
    expect(shape.inputs).toEqual([TYPE_OBJECT]);
  });

  test('parses an instance of a class', () => {
    const input = new TestClass();

    expect(new InstanceShape(TestClass).parse(input)).toBe(input);
  });

  test('raises an issue if an input is not an instance of the class', () => {
    expect(new InstanceShape(TestClass).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_INSTANCE_OF, input: {}, param: TestClass, message: 'Must be a class instance' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new InstanceShape(TestClass, { message: 'aaa', meta: 'bbb' }).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_INSTANCE_OF, input: {}, param: TestClass, message: 'aaa', meta: 'bbb' }],
    });
  });

  describe('inputs', () => {
    test('uses function input type for an Function and its subclasses', () => {
      expect(new InstanceShape(Function).inputs).toEqual([TYPE_FUNCTION]);
      expect(new InstanceShape(class extends Function {}).inputs).toEqual([TYPE_FUNCTION]);
    });

    test('uses Promise input type for an Function and its subclasses', () => {
      expect(new InstanceShape(Promise).inputs).toEqual([TYPE_PROMISE]);
    });

    test('uses array input type for an Array and its subclasses', () => {
      expect(new InstanceShape(Array).inputs).toEqual([TYPE_ARRAY]);
      expect(new InstanceShape(class extends Array {}).inputs).toEqual([TYPE_ARRAY]);
    });

    test('uses date input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Date).inputs).toEqual([TYPE_DATE]);
      expect(new InstanceShape(class extends Date {}).inputs).toEqual([TYPE_DATE]);
    });

    test('uses Set input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Set).inputs).toEqual([TYPE_SET]);
      expect(new InstanceShape(class extends Set {}).inputs).toEqual([TYPE_SET]);
    });

    test('uses Map input type for an Date and its subclasses', () => {
      expect(new InstanceShape(Map).inputs).toEqual([TYPE_MAP]);
      expect(new InstanceShape(class extends Map {}).inputs).toEqual([TYPE_MAP]);
    });
  });
});
