import { nullish, number } from '../../main';

describe('nullish', () => {
  test('infers type', () => {
    const output1: number | null | undefined = nullish(number()).parse(111);

    const output2: number | null = nullish(number(), 222).parse(111);
  });
});
