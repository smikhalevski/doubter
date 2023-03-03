const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('record(string(), number())', () => {
  const value = { a: 1, b: 2, c: 3 };

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      propertyNames: { type: 'string' },
      additionalProperties: { type: 'number' },
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.record(zod.string(), zod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.record(myzod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.record(valita.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.record(doubter.string(), doubter.number());

    measure(() => {
      shape.parse(value);
    });
  });
});
