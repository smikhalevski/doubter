const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('number()', () => {
  const value = 4;

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'number',
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.number();

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().multiple(1)', () => {
  const value = 49;

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'number',
      multipleOf: 1,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.number().multipleOf(1);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.number().multiple(1);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().gte(1).lte(5)', () => {
  const value = 4;

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'number',
      minimum: 1,
      maximum: 5,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.number().min(1).max(5);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.number().min(1).max(5);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.number().gte(1).lte(5);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().integer()', () => {
  const value = 4;

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'integer',
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.number().int();

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.number().integer();

    measure(() => {
      shape.parse(value);
    });
  });
});
