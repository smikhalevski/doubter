import { describe, measure, test } from 'toofast';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.mjs';

describe('fn([number(), number()]).ensure(…)', () => {
  test('zod', () => {
    const fn = zod.function(zod.tuple([zod.number(), zod.number()])).implement((a, b) => a + b);

    measure(() => {
      fn(1, 2);
    });
  });

  test('doubter', () => {
    const fn = doubter.fn([doubter.number(), doubter.number()]).ensure((a, b) => a + b);

    measure(() => {
      fn(1, 2);
    });
  });
});
