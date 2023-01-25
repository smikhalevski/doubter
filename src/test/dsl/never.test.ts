import * as d from '../../main';

describe('never', () => {
  test('returns a never shape', () => {
    expect(d.never()).toBeInstanceOf(d.NeverShape);
  });
});
