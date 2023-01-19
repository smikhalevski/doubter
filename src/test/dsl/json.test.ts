import * as d from '../../main';

describe('json', () => {
  test('returns a shape', () => {
    expect(d.json()).toBeInstanceOf(d.JSONShape);
  });
});
