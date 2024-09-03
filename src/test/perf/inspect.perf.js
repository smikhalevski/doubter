const { inspect } = require('../../../lib/utils');

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

  test('inspect(…)', measure => {
    measure(() => {
      inspect(value);
    });
  });

  test('JSON.stringify(…)', measure => {
    measure(() => {
      JSON.stringify(value);
    });
  });
});
