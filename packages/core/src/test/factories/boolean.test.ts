import { boolean } from '../../main';

describe('boolean', () => {
  test('raises if value is not a boolean', () => {
    expect(boolean().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'boolean',
      },
    ]);
  });

  test('allows a boolean', () => {
    expect(boolean().validate(true)).toEqual([]);
  });
});
