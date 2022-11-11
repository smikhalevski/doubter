import * as d from '../../main';
import { CODE_ENUM } from '../../main/constants';

describe('enum', () => {
  test('infers type', () => {
    enum Foo {
      AAA,
      BBB,
    }

    const output1: 1 | 'aaa' = d.enum([1, 'aaa']).parse('aaa');

    const output2: Foo = d.enum(Foo).parse(Foo.AAA);
  });

  test('raises issue when value is not one of values from the list', () => {
    expect(d.enum(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 'ccc',
          param: ['aaa', 'bbb'],
          message: 'Must be equal to one of: aaa,bbb',
          meta: undefined,
        },
      ],
    });
  });

  test('allows the value from the list', () => {
    expect(d.enum(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises issue when value is not one of the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(d.enum(Foo).try(2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 2,
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of: 0,1',
          meta: undefined,
        },
      ],
    });
  });

  test('raises issue when value is the name of the numeric enum element', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(d.enum(Foo).try('AAA')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 'AAA',
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of: 0,1',
          meta: undefined,
        },
      ],
    });
  });

  test('allows the value from the numeric enum', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(d.enum(Foo).parse(Foo.AAA)).toBe(Foo.AAA);
  });

  test('raises issue when value is not one of the string enum values', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(d.enum(Foo).try('ccc')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 'ccc',
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of: aaa,bbb',
          meta: undefined,
        },
      ],
    });
  });

  test('allows the value from the string enum', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(d.enum(Foo).parse(Foo.AAA)).toBe(Foo.AAA);
  });

  test('allows the value from the object', () => {
    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(d.enum(obj).parse(obj.AAA)).toBe(obj.AAA);
  });
});
