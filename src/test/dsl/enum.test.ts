import { enum as _enum } from '../../main';
import { CODE_ENUM } from '../../main/shapes/constants';

describe('enum', () => {
  test('infers type', () => {
    enum Foo {
      AAA,
      BBB,
    }

    const output1: 1 | 'aaa' = _enum([1, 'aaa']).parse('aaa');

    const output2: Foo = _enum(Foo).parse(Foo.AAA);
  });

  test('raises issue when value is not one of values from the list', () => {
    expect(_enum(['aaa', 'bbb']).validate('ccc')).toEqual([
      {
        code: CODE_ENUM,
        path: [],
        input: 'ccc',
        param: ['aaa', 'bbb'],
        message: 'Must be equal to one of: aaa, bbb',
        meta: undefined,
      },
    ]);
  });

  test('allows the value from the list', () => {
    expect(_enum(['aaa', 'bbb']).validate('aaa')).toBe(null);
  });

  test('raises issue when value is not one of the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(_enum(Foo).validate(2)).toEqual([
      {
        code: CODE_ENUM,
        path: [],
        input: 2,
        param: [Foo.AAA, Foo.BBB],
        message: 'Must be equal to one of: 0, 1',
        meta: undefined,
      },
    ]);
  });

  test('raises issue when value is the name of the numeric enum element', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(_enum(Foo).validate('AAA')).toEqual([
      {
        code: CODE_ENUM,
        path: [],
        input: 'AAA',
        param: [Foo.AAA, Foo.BBB],
        message: 'Must be equal to one of: 0, 1',
        meta: undefined,
      },
    ]);
  });

  test('allows the value from the numeric enum', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(_enum(Foo).validate(Foo.AAA)).toBe(null);
  });

  test('raises issue when value is not one of the string enum values', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(_enum(Foo).validate('ccc')).toEqual([
      {
        code: CODE_ENUM,
        path: [],
        input: 'ccc',
        param: [Foo.AAA, Foo.BBB],
        message: 'Must be equal to one of: aaa, bbb',
        meta: undefined,
      },
    ]);
  });

  test('allows the value from the string enum', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(_enum(Foo).validate(Foo.AAA)).toBe(null);
  });
});
