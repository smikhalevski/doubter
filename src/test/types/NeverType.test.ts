import { NeverType } from '../../main';

describe('NeverType', () => {
  test('always raises', () => {
    expect(new NeverType().validate(111)).toEqual([
      {
        code: 'never',
        path: [],
        input: 111,
        param: undefined,
        message: 'Must not be used',
        meta: undefined,
      },
    ]);
  });
});
