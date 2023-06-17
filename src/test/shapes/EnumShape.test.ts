import { EnumShape } from '../../main';
import { CODE_ENUM } from '../../main/constants';
import { getEnumValues } from '../../main/shape/EnumShape';
import { TYPE_ARRAY, TYPE_OBJECT } from '../../main/Type';

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

    expect(shape.inputs).toEqual(['aaa', 'bbb']);
  });

  test('an empty enum has empty inputs', () => {
    const shape = new EnumShape([]);

    expect(shape.inputs).toEqual([]);
  });

  test('creates an enum shape from a native numeric enum', () => {
    const shape = new EnumShape(NumberMockEnum);

    expect(shape.inputs).toEqual([NumberMockEnum.AAA, NumberMockEnum.BBB]);
  });

  test('creates an enum shape from a native string enum', () => {
    expect(new EnumShape(StringMockEnum).inputs).toEqual([StringMockEnum.AAA, StringMockEnum.BBB]);
  });

  test('creates an enum shape from a mapping object', () => {
    const obj = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(new EnumShape(obj).inputs).toEqual([obj.AAA, obj.BBB]);
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

      expect(shape.coerce().inputs).toEqual([0, 1, '0', '1', 'AAA', 'BBB', TYPE_ARRAY, TYPE_OBJECT]);

      expect(shape.coerce().parse('AAA')).toEqual(NumberMockEnum.AAA);
      expect(shape.parse('AAA', { coerced: true })).toEqual(NumberMockEnum.AAA);
    });

    test('coerces the key of a const object', () => {
      const shape = new EnumShape({
        AAA: 'aaa',
        BBB: 'bbb',
      } as const);

      expect(shape.coerce().inputs).toEqual(['aaa', 'bbb', 'AAA', 'BBB', TYPE_ARRAY, TYPE_OBJECT]);

      expect(shape.coerce().parse('AAA')).toEqual('aaa');
      expect(shape.parse('AAA', { coerced: true })).toEqual('aaa');
    });

    test('coerces from an array', () => {
      const shape = new EnumShape([111, 222]);

      expect(shape.coerce().inputs).toEqual([111, 222, TYPE_ARRAY, TYPE_OBJECT]);

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
