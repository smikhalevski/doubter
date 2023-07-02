const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('array()', () => {
  const value = [1, 2, 3];

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
    });

    measure(() => {
      validate(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.array();

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('array(number())', () => {
  const value = [1, 2, 3];

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: { type: 'number' },
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.array(zod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.array(myzod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.array(valita.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.array(doubter.number());

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('array(number()).length(3)', () => {
  const value = [1, 2, 3];

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: { type: 'number' },
      minItems: 3,
      maxItems: 3,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.array(zod.number()).length(3);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.array(myzod.number()).length(3);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.array(doubter.number()).length(3);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('array(number().gte(0).lte(10)).length(3)', () => {
  const value = [1, 2, 3];

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: {
        type: 'number',
        minimum: 0,
      },
      minItems: 3,
      maxItems: 3,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.array(zod.number().min(0).max(10)).length(3);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.array(myzod.number().min(0).max(10)).length(3);

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita
      .array(
        valita
          .number()
          .assert(v => v >= 0)
          .assert(v => v <= 10)
      )
      .assert(v => v.length === 3);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.array(doubter.number().gte(0).lte(10)).length(3);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('tuple([number(), number()])', () => {
  const value = [111, 222];

  test('Ajv', measure => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: [{ type: 'number' }, { type: 'number' }],
      minItems: 2,
      maxItems: 2,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod.tuple([zod.number(), zod.number()]);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.tuple([myzod.number(), myzod.number()]);

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.tuple([valita.number(), valita.number()]);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter.tuple([doubter.number(), doubter.number()]);

    measure(() => {
      shape.parse(value);
    });
  });
});
