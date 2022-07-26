import { OneOfType } from '../../main';

describe('OneOfType', () => {
  test('allows the value from the list', () => {
    expect(new OneOfType(['aaa', 'bbb']).validate('aaa')).toBe(null);
  });

  test('raises issue when value is not one of values from the list', () => {
    expect(new OneOfType(['aaa', 'bbb']).validate('ccc')).toEqual([
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
});
