const Ajv = require('ajv');
const zod = require('zod');
const doubter = require('../../../lib');

describe('set(number())', () => {
  const value = new Set([111, 222]);
  const ajvValue = Array.from(value);

  test('Ajv', measure => {
    const ajv = new Ajv();

    const schema = {
      $id: 'test',
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: {
        type: 'number',
      },
      uniqueItems: true,
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(ajvValue);
    });
  });

  test('zod', measure => {
    const type = zod.set(zod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.set(doubter.number());

    measure(() => {
      shape.parse(value);
    });
  });
});
