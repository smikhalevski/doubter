import { string, StringType } from '../../main';

describe('string', () => {
  test('returns an string type', () => {
    expect(string()).toBeInstanceOf(StringType);
  });
});
