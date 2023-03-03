const zod = require('zod');
const myzod = require('myzod');
const doubter = require('../../../lib');

describe('and([object({ foo: string() }), object({ bar: number() })])', () => {
  const value = { foo: 'aaa', bar: 123 };

  test('zod', measure => {
    const type = zod.intersection(
      zod.object({ foo: zod.string() }).passthrough(),
      zod.object({ bar: zod.number() }).passthrough()
    );

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.intersection(
      myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
      myzod.object({ bar: myzod.number() }, { allowUnknown: true })
    );

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.and([doubter.object({ foo: doubter.string() }), doubter.object({ bar: doubter.number() })]);

    measure(() => {
      shape.parse(value);
    });
  });
});
