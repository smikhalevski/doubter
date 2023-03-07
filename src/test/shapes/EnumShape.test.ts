import { EnumShape } from '../../main';
import { CODE_ENUM, TYPE_ARRAY, TYPE_NEVER, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/constants';
import { getEnumValues } from '../../main/shapes/EnumShape';

enum NumberMockEnum {
  AAA,
  BBB,
}

enum StringMockEnum {
  AAA = 'aaa',
  BBB = 'bbb',
}

describe('EnumShape', () => {
  test('creates an EnumShape from an array', () => {
    const shape = new EnumShape(['aaa', 'bbb']);

    expect(shape.inputValues).toEqual(['aaa', 'bbb']);
    expect(shape.inputTypes).toEqual([TYPE_STRING]);
  });

  test('empty enums have never type', () => {
    const shape = new EnumShape([]);

    expect(shape.inputValues).toEqual([]);
    expect(shape.inputTypes).toEqual([TYPE_NEVER]);
  });

  test('creates an enum shape from a native numeric enum', () => {
    const shape = new EnumShape(NumberMockEnum);

    expect(shape.inputValues).toEqual([NumberMockEnum.AAA, NumberMockEnum.BBB]);
    expect(shape.inputTypes).toEqual([TYPE_NUMBER]);
  });

  test('creates an enum shape from a native string enum', () => {
    expect(new EnumShape(StringMockEnum).inputValues).toEqual([StringMockEnum.AAA, StringMockEnum.BBB]);
  });

  test('creates an enum shape from a mapping object', () => {
    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(new EnumShape(obj).inputValues).toEqual([obj.AAA, obj.BBB]);
  });

  test('raises an issue if an input is not one of the numeric enum values', () => {
    expect(new EnumShape(NumberMockEnum).try(2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          input: 2,
          param: [NumberMockEnum.AAA, NumberMockEnum.BBB],
          message: 'Must be equal to one of 0,1',
        },
      ],
    });
  });

  test('raises an issue when an input is the key of the numeric enum', () => {
    expect(new EnumShape(NumberMockEnum).try('AAA')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          input: 'AAA',
          param: [NumberMockEnum.AAA, NumberMockEnum.BBB],
          message: 'Must be equal to one of 0,1',
        },
      ],
    });
  });

  test('raises an issue when an input is not among the string enum values', () => {
    expect(new EnumShape(StringMockEnum).try('ccc')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          input: 'ccc',
          param: [StringMockEnum.AAA, StringMockEnum.BBB],
          message: 'Must be equal to one of aaa,bbb',
        },
      ],
    });
  });

  test('parses the string enum value', () => {
    expect(new EnumShape(StringMockEnum).parse(StringMockEnum.AAA)).toBe(StringMockEnum.AAA);
  });

  test('parses a value from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises an issue when an input is not one of values from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [{ code: CODE_ENUM, input: 'ccc', param: ['aaa', 'bbb'], message: 'Must be equal to one of aaa,bbb' }],
    });
  });

  test('considers NaN values equal', () => {
    expect(new EnumShape([NaN]).parse(NaN)).toBe(NaN);
  });

  test('applies checks', () => {
    const shape = new EnumShape(['aaa', 'bbb']).check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('coerce', () => {
    test('coerces the key of the numeric enum', () => {
      const shape = new EnumShape(NumberMockEnum);

      expect(shape.coerce().inputTypes).toEqual([TYPE_NUMBER, TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT]);

      expect(shape.coerce().parse('AAA')).toEqual(NumberMockEnum.AAA);
      expect(shape.parse('AAA', { coerced: true })).toEqual(NumberMockEnum.AAA);
    });

    test('coerces the key of a const object', () => {
      const shape = new EnumShape({
        AAA: 'aaa',
        BBB: 'bbb',
      } as const);

      expect(shape.coerce().inputTypes).toEqual([TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT]);

      expect(shape.coerce().parse('AAA')).toEqual('aaa');
      expect(shape.parse('AAA', { coerced: true })).toEqual('aaa');
    });

    test('coerces from an array', () => {
      const shape = new EnumShape([111, 222]);

      expect(shape.coerce().inputTypes).toEqual([TYPE_NUMBER, TYPE_ARRAY, TYPE_OBJECT]);

      expect(shape.coerce().parse([111])).toBe(111);
      expect(shape.parse(111, { coerced: true })).toBe(111);
    });
  });
});

describe('getEnumValues', () => {
  test('removes aliases from numerical enums', () => {
    expect(getEnumValues(NumberMockEnum)).toEqual([0, 1]);
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
