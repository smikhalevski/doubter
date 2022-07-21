import { integer } from '../../main';

describe('integer', () => {
  test('raises if value is not an integer', () => {
    expect(integer().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'integer',
      },
    ]);

    expect(integer().validate(111.222)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111.222,
        param: 'integer',
      },
    ]);

    expect(integer().validate(NaN)).toEqual([
      {
        code: 'type',
        path: [],
        input: NaN,
        param: 'integer',
      },
    ]);

    expect(integer().validate(Infinity)).toEqual([
      {
        code: 'type',
        path: [],
        input: Infinity,
        param: 'integer',
      },
    ]);
  });

  test('allows an integer', () => {
    expect(integer().validate(123)).toEqual([]);
  });
});
