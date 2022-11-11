import { EnumShape } from '../../main';
import { CODE_ENUM } from '../../main/constants';

describe('EnumShape', () => {
  test('allows the value from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).parse('aaa')).toBe('aaa');
  });

  test('raises an issue when value is not one of values from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).try('ccc')).toEqual({
      ok: false,
      issues: [
        { code: CODE_ENUM, path: [], input: 'ccc', param: ['aaa', 'bbb'], message: 'Must be equal to one of: aaa,bbb' },
      ],
    });
  });
});
