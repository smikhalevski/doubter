import { number, or, string } from '../../main';

describe('or', () => {
  test('allows any of the types', () => {
    const type = or(string(), number());

    expect(type.validate('aaa')).toEqual([]);
    expect(type.validate(111)).toEqual([]);
  });

  test('raises if none of the types', () => {
    const type = or(string().max(2), number());

    expect(type.validate('aaa')).toEqual([
      {
        code: 'union',
        input: 'aaa',
        path: [],
        param: [
          {
            code: 'stringMaxLength',
            path: [],
            input: 'aaa',
            param: 2,
          },
          {
            code: 'type',
            path: [],
            input: 'aaa',
            param: 'number',
          },
        ],
      },
    ]);
  });
});
