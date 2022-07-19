import { array, ParserContext } from '../../main';

describe('array', () => {
  let context: ParserContext;

  beforeEach(() => {
    context = new ParserContext();
  });

  test('raises issue when value is not an array', () => {
    expect(array().validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        value: 111,
        param: 'array',
      },
    ]);
  });
});
