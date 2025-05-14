import { describe, measure, test } from 'toofast';
import { inspect } from '../../../lib/utils.mjs';

describe('inspect', () => {
  const value = {
    a1: [1, 2, 3],
    a2: 'foo',
    a3: false,
    a4: {
      a41: 'bar',
      a42: 3.1415,
    },
  };

  test('inspect(…)', () => {
    measure(() => {
      inspect(value);
    });
  });

  test('JSON.stringify(…)', () => {
    measure(() => {
      JSON.stringify(value);
    });
  });
});
