const zod = require('zod');
const doubter = require('../../../lib');

describe('fn([number(), number()]).ensure(…)', () => {
  test('zod', measure => {
    const fn = zod.function(zod.tuple([zod.number(), zod.number()])).implement((a, b) => a + b);

    measure(() => {
      fn(1, 2);
    });
  });

  test('doubter', measure => {
    const fn = doubter.fn([doubter.number(), doubter.number()]).ensure((a, b) => a + b);

    measure(() => {
      fn(1, 2);
    });
  });
});
