import * as d from '../../main';

describe('date', () => {
  test('returns a shape', () => {
    expect(d.date()).toBeInstanceOf(d.DateShape);
  });
});
