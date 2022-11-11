import * as d from '../../main';

describe('record', () => {
  test('infers type', () => {
    const output: { bbb: number } = d
      .record(
        d.string().transform((): 'bbb' => 'bbb'),
        d.number()
      )
      .parse({ aaa: 111 });
  });

  test('returns an record shape', () => {
    expect(d.record(d.string(), d.number())).toBeInstanceOf(d.RecordShape);
  });
});
