import { oneOf } from '../../main';

describe('oneOf', () => {
  test('raises issue when value is not one of values from the list', () => {
    expect(oneOf(['aaa', 'bbb']).validate('ccc')).toEqual([
      {
        code: 'oneOf',
        path: [],
        input: 'ccc',
        param: ['aaa', 'bbb'],
        message: 'Must be equal to one of: aaa, bbb',
        meta: undefined,
      },
    ]);
  });

  test('allows the value from the list', () => {
    expect(oneOf(['aaa', 'bbb']).validate('aaa')).toBe(null);
  });

  test('raises issue when value is not one of the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(oneOf(Foo).validate(2)).toEqual([
      {
        code: 'oneOf',
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

    expect(oneOf(Foo).validate('AAA')).toEqual([
      {
        code: 'oneOf',
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

    expect(oneOf(Foo).validate(Foo.AAA)).toBe(null);
  });

  test('raises issue when value is not one of the string enum values', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(oneOf(Foo).validate('ccc')).toEqual([
      {
        code: 'oneOf',
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

    expect(oneOf(Foo).validate(Foo.AAA)).toBe(null);
  });
});
