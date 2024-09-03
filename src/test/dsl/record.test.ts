import * as d from '../../main';

describe('record', () => {
  test('returns a record shape', () => {
    expect(d.record(d.string(), d.number())).toBeInstanceOf(d.RecordShape);
  });

  test('enhanced by a plugin', () => {
    expect(d.record(d.string()).plain()).toBeInstanceOf(d.RecordShape);
  });
});
