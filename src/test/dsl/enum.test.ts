import * as d from '../../main';
import { CODE_ENUM } from '../../main/constants';

describe('enum', () => {
  test('infers type', () => {
    enum Foo {
      AAA,
      BBB,
    }

    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    } as const;

    const value1: 111 | 'aaa' = d.enum([111, 'aaa']).parse('aaa');
    const value2: Foo = d.enum(Foo).parse(Foo.AAA);
    const value3: 'aaa' | 'bbb' = d.enum(obj).parse(obj.AAA);
  });

  test('returns an enum shape', () => {
    const shape = d.enum([111, 222]);

    expect(shape).toBeInstanceOf(d.EnumShape);
    expect(shape.values).toEqual([111, 222]);
  });

  test('parses the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(d.enum(Foo).parse(Foo.AAA)).toBe(Foo.AAA);
  });

  test('raises an issue if an input is not one of the numeric enum values', () => {
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

  test('raises an issue when an input is the key of the numeric enum', () => {
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

  test('raises an issue when an input is not among the string enum values', () => {
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

  test('parses the string enum value', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(d.enum(Foo).parse(Foo.AAA)).toBe(Foo.AAA);
  });

  test('parses the enum-like object value', () => {
    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(d.enum(obj).parse(obj.AAA)).toBe(obj.AAA);
  });
});
