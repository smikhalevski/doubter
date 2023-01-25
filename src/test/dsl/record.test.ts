import * as d from '../../main';

describe('record', () => {
  test('returns a record shape', () => {
    expect(d.record(d.string(), d.number())).toBeInstanceOf(d.RecordShape);
  });
});
