import { EnumShape } from '../../main';
import { CODE_ENUM } from '../../main/constants';

describe('EnumShape', () => {
  test('creates an enum shape', () => {
    const shape = new EnumShape(['aaa', 'bbb']);

    expect(shape.values).toEqual(['aaa', 'bbb']);
  });

  test('parses a value from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises an issue when an input is not one of values from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [
        { code: CODE_ENUM, path: [], input: 'ccc', param: ['aaa', 'bbb'], message: 'Must be equal to one of: aaa,bbb' },
      ],
    });
  });

  test('considers NaN values equal', () => {
    expect(new EnumShape([NaN]).try(NaN)).toEqual({ ok: true, value: NaN });
  });
});
