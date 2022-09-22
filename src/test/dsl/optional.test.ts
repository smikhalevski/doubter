import { number, optional, OptionalShape } from '../../main';

describe('optional', () => {
  test('infers type', () => {
    const output1: number | null | undefined = optional(number()).parse(111);

    const output2: number | null = optional(number(), 222).parse(111);
  });

  test('returns an optional shape', () => {
    expect(optional(number())).toBeInstanceOf(OptionalShape);
  });
});
