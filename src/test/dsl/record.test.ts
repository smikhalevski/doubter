import { number, record, RecordType, string } from '../../main';

describe('record', () => {
  test('returns an record type', () => {
    expect(record(string(), number())).toBeInstanceOf(RecordType);
  });
});
