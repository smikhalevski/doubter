import { never } from '../../main';

describe('never', () => {
  test('always raises', () => {
    expect(never().validate(111)).toEqual([
      {
        code: 'never',
        path: [],
        input: 111,
        param: undefined,
      },
    ]);
  });
});
