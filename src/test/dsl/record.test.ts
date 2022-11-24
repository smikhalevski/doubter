import * as d from '../../main';

describe('record', () => {
  test('returns an record shape', () => {
    expect(d.record(d.string(), d.number())).toBeInstanceOf(d.RecordShape);
  });
});
