import { number, string, tuple, TupleShape } from '../../main';

describe('tuple', () => {
  test('infers type', () => {
    const output: [string, number] = tuple([string(), number()]).parse(['aaa', 111]);
  });

  test('returns an tuple shape', () => {
    expect(tuple([number()])).toBeInstanceOf(TupleShape);
  });
});
