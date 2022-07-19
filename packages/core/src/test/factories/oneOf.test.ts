import { oneOf } from '../../main';

describe('oneOf', () => {
  test('raises issue when value is not one of values from the list', () => {
    expect(oneOf('aaa', 'bbb').validate('ccc')).toEqual([
      {
        code: 'one_of',
        path: [],
        value: 'ccc',
        param: ['aaa', 'bbb'],
      },
    ]);
  });

  test('allows the value from the list', () => {
    expect(oneOf('aaa', 'bbb').validate('aaa')).toEqual([]);
  });

  test('raises issue when value is not one of the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(oneOf(Foo).validate(2)).toEqual([
      {
        code: 'one_of',
        path: [],
        value: 2,
        param: [Foo.AAA, Foo.BBB],
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
        code: 'one_of',
        path: [],
        value: 'AAA',
        param: [Foo.AAA, Foo.BBB],
      },
    ]);
  });

  test('allows the value from the numeric enum', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(oneOf(Foo).validate(Foo.AAA)).toEqual([]);
  });

  test('raises issue when value is not one of the string enum values', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(oneOf(Foo).validate('ccc')).toEqual([
      {
        code: 'one_of',
        path: [],
        value: 'ccc',
        param: [Foo.AAA, Foo.BBB],
      },
    ]);
  });

  test('allows the value from the string enum', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(oneOf(Foo).validate(Foo.AAA)).toEqual([]);
  });
});
