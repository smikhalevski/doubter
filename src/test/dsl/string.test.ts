import { string, StringShape } from '../../main';

describe('string', () => {
  test('returns an string shape', () => {
    expect(string()).toBeInstanceOf(StringShape);
  });
});
