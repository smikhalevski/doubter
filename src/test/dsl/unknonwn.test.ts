import * as d from '../../main';

describe('unknown', () => {
  test('returns a shape', () => {
    expect(d.unknown()).toBeInstanceOf(d.Shape);
  });
});
