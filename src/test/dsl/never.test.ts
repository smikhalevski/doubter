import * as d from '../../main';

describe('never', () => {
  test('returns an never shape', () => {
    expect(d.never()).toBeInstanceOf(d.NeverShape);
  });
});
