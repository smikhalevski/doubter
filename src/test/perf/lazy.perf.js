const doubter = require('../../../lib');

describe('lazy(() => object(…))', () => {
  const value = {};
  value.value = value;

  test('doubter', measure => {
    const shape = doubter.lazy(() => doubter.object({ value: shape }));

    measure(() => {
      shape.parse(value);
    });
  });
});
