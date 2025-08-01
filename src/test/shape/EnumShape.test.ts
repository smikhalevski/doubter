import { describe, expect, test } from 'vitest';
import { EnumShape } from '../../main/index.js';
import { CODE_TYPE_ENUM } from '../../main/constants.js';
import { getEnumValues } from '../../main/shape/EnumShape.js';
import { Type } from '../../main/Type.js';

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
    const source = {
      AAA: 'aaa',
      BBB: 'bbb',
    };

    expect(new EnumShape(source).inputs).toEqual([source.AAA, source.BBB]);
  });

  test('raises an issue if an input is not one of the numeric enum values', () => {
    expect(new EnumShape(NumberMockEnum).try(2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_ENUM,
          input: 2,
          param: [NumberMockEnum.AAA, NumberMockEnum.BBB],
          message: 'Must be equal to one of: 0, 1',
        },
      ],
    });
  });

  test('raises an issue when an input is the key of the numeric enum', () => {
    expect(new EnumShape(NumberMockEnum).try('AAA')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_ENUM,
          input: 'AAA',
          param: [NumberMockEnum.AAA, NumberMockEnum.BBB],
          message: 'Must be equal to one of: 0, 1',
        },
      ],
    });
  });

  test('raises an issue when an input is not among the string enum values', () => {
    expect(new EnumShape(StringMockEnum).try('ccc')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_ENUM,
          input: 'ccc',
          param: [StringMockEnum.AAA, StringMockEnum.BBB],
          message: 'Must be equal to one of: "aaa", "bbb"',
        },
      ],
    });
  });

  test('parses the string enum value', () => {
    expect(new EnumShape(StringMockEnum).parse(StringMockEnum.AAA)).toBe(StringMockEnum.AAA);
  });

  test('parses a value from the array', () => {
    expect(new EnumShape(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises an issue when an input is not one of values from the array', () => {
    expect(new EnumShape(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [
        { code: CODE_TYPE_ENUM, input: 'ccc', param: ['aaa', 'bbb'], message: 'Must be equal to one of: "aaa", "bbb"' },
      ],
    });
  });

  test('considers NaN values equal', () => {
    expect(new EnumShape([NaN]).parse(NaN)).toBe(NaN);
  });

  test('applies operations', () => {
    const shape = new EnumShape(['aaa', 'bbb']).check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('coerce', () => {
    test('detects types coercible to numeric enum value', () => {
      expect(new EnumShape(NumberMockEnum).coerce().inputs).toEqual([
        Type.ARRAY,
        Type.OBJECT,
        Type.NUMBER,
        Type.STRING,
        Type.BOOLEAN,
        Type.BIGINT,
        Type.DATE,
        null,
        undefined,
      ]);
    });

    test('detects types coercible to const object', () => {
      const AAA = {};
      const BBB = {};

      expect(new EnumShape({ AAA, BBB }).coerce().inputs).toEqual([AAA, BBB, 'AAA', 'BBB', Type.ARRAY]);
    });

    test('detects types coercible to a value in an array', () => {
      const AAA = {};
      const BBB = {};

      expect(new EnumShape([AAA, BBB]).coerce().inputs).toEqual([AAA, BBB, Type.ARRAY]);
      expect(new EnumShape(['aaa', 'bbb']).coerce().inputs).toEqual([
        Type.ARRAY,
        Type.OBJECT,
        Type.STRING,
        Type.NUMBER,
        Type.BOOLEAN,
        Type.BIGINT,
        Type.DATE,
        null,
        undefined,
      ]);
    });

    test('coerces the key of a const object', () => {
      const shape = new EnumShape({
        AAA: 'aaa',
        BBB: 'bbb',
      } as const).coerce();

      expect(shape.parse('AAA')).toEqual('aaa');
      expect(shape.parse(['AAA'])).toEqual('aaa');
      expect(shape.parse(new String('AAA'))).toEqual('aaa');
      expect(shape.parse([new String('AAA')])).toEqual('aaa');

      expect(shape.parse(['aaa'])).toEqual('aaa');
      expect(shape.parse(new String('aaa'))).toEqual('aaa');
      expect(shape.parse([new String('aaa')])).toEqual('aaa');
    });

    test('coerces to a value from an array', () => {
      const shape = new EnumShape([111, 222]).coerce();

      expect(shape.parse([111])).toBe(111);
    });
  });
});

describe('getEnumValues', () => {
  test('removes aliases from numerical enums', () => {
    expect(getEnumValues(NumberMockEnum)).toEqual([0, 1]);
  });

  test('removes aliases from enum-like objects', () => {
    const source = {
      0: 'AAA',
      1: 'BBB',
      AAA: 0,
      BBB: 1,
    };

    expect(getEnumValues(source)).toEqual([0, 1]);
  });

  test('preserves partial aliases', () => {
    const source = {
      0: 'AAA',
      AAA: 0,
      BBB: 1,
    };

    expect(getEnumValues(source)).toEqual(['AAA', 0, 1]);
  });
});
