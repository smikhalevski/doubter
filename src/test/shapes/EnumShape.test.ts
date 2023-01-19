import { EnumShape } from '../../main';
import { CODE_ENUM } from '../../main/constants';
import { getEnumValues } from '../../main/shapes/EnumShape';

describe('EnumShape', () => {
  test('creates an enum shape from an array', () => {
    const shape = new EnumShape(['aaa', 'bbb']);

    expect(shape.values).toEqual(['aaa', 'bbb']);
  });

  test('creates an enum shape from a native numeric enum', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(new EnumShape(Foo).values).toEqual([Foo.AAA, Foo.BBB]);
  });

  test('creates an enum shape from a native string enum', () => {
    enum Foo {
      AAA = 'aaa',
      BBB = 'bbb',
    }

    expect(new EnumShape(Foo).values).toEqual([Foo.AAA, Foo.BBB]);
  });

  test('creates an enum shape from a mapping object', () => {
    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(new EnumShape(obj).values).toEqual([obj.AAA, obj.BBB]);
  });

  test('raises an issue if an input is not one of the numeric enum values', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(new EnumShape(Foo).try(2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 2,
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of 0,1',
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

    expect(new EnumShape(Foo).try('AAA')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 'AAA',
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of 0,1',
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

    expect(new EnumShape(Foo).try('ccc')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          path: [],
          input: 'ccc',
          param: [Foo.AAA, Foo.BBB],
          message: 'Must be equal to one of aaa,bbb',
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

    expect(new EnumShape(Foo).parse(Foo.AAA)).toBe(Foo.AAA);
  });

  test('parses a value from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises an issue when an input is not one of values from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [
        { code: CODE_ENUM, path: [], input: 'ccc', param: ['aaa', 'bbb'], message: 'Must be equal to one of aaa,bbb' },
      ],
    });
  });

  test('considers NaN values equal', () => {
    expect(new EnumShape([NaN]).parse(NaN)).toBe(NaN);
  });

  test('coerces the key of the numeric enum', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(new EnumShape(Foo).coerce().parse('AAA')).toEqual(Foo.AAA);
    expect(new EnumShape(Foo).parse('AAA', { coerced: true })).toEqual(Foo.AAA);
  });

  test('applies checks', () => {
    const shape = new EnumShape(['aaa', 'bbb']).check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });
});

describe('getEnumValues', () => {
  test('removes aliases from numerical enums', () => {
    enum Foo {
      AAA,
      BBB,
    }

    expect(getEnumValues(Foo)).toEqual([0, 1]);
  });

  test('removes aliases from enum-like objects', () => {
    const obj = {
      0: 'AAA',
      1: 'BBB',
      AAA: 0,
      BBB: 1,
    };

    expect(getEnumValues(obj)).toEqual([0, 1]);
  });

  test('preserves partial aliases', () => {
    const obj = {
      0: 'AAA',
      AAA: 0,
      BBB: 1,
    };

    expect(getEnumValues(obj)).toEqual(['AAA', 0, 1]);
  });
});
