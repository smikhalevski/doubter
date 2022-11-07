import { number, record, RecordShape, string } from '../../main';

describe('record', () => {
  test('infers type', () => {
    const output: { bbb: number } = record(
      string().convert((): 'bbb' => 'bbb'),
      number()
    ).parse({ aaa: 111 });
  });

  test('returns an record shape', () => {
    expect(record(string(), number())).toBeInstanceOf(RecordShape);
  });
});
