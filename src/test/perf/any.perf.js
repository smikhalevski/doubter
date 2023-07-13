const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('any().check(isNaN)', () => {
  test('valita', measure => {
    const type = valita.unknown().assert(isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', measure => {
    const shape = doubter.any().check(v => (isNaN(v) ? null : []));

    measure(() => {
      shape.parse(NaN);
    });
  });
});

describe('any().refine(isNaN)', () => {
  test('valita', measure => {
    const type = valita.unknown().assert(isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', measure => {
    const shape = doubter.any().refine(isNaN);

    measure(() => {
      shape.parse(NaN);
    });
  });
});
