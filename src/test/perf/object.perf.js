const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../../lib');

describe('object({ foo: string(), bar: number() })', () => {
  const value = {
    foo: 'aaa',
    bar: 111,
  };

  test('Ajv', measure => {
    const ajv = new Ajv();

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
      required: ['foo', 'bar'],
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod
      .object({
        foo: zod.string(),
        bar: zod.number(),
      })
      .passthrough();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.object(
      {
        foo: myzod.string(),
        bar: myzod.number(),
      },
      { allowUnknown: true }
    );

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.object({
      foo: valita.string(),
      bar: valita.number(),
    });

    const options = { mode: 'passthrough' };

    measure(() => {
      type.parse(value, options);
    });
  });

  test('doubter', measure => {
    const shape = doubter.object({
      foo: doubter.string(),
      bar: doubter.number(),
    });

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('object({ foo: string() }).rest(string())', () => {
  const value = {
    foo: 'aaa',
    bar: 'bbb',
  };

  test('Ajv', measure => {
    const ajv = new Ajv();

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      additionalProperties: { type: 'string' },
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod
      .object({
        foo: zod.string(),
      })
      .catchall(zod.string());

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita
      .object({
        foo: valita.string(),
      })
      .rest(valita.string());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter
      .object({
        foo: doubter.string(),
      })
      .rest(doubter.string());

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('object({ foo: string(), bar: number() }).exact()', () => {
  const value = {
    foo: 'aaa',
    bar: 111,
  };

  test('Ajv', measure => {
    const ajv = new Ajv();

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
      additionalProperties: false,
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(value);
    });
  });

  test('zod', measure => {
    const type = zod
      .object({
        foo: zod.string(),
        bar: zod.number(),
      })
      .strict();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', measure => {
    const type = myzod.object({
      foo: myzod.string(),
      bar: myzod.number(),
    });

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', measure => {
    const type = valita.object({
      foo: valita.string(),
      bar: valita.number(),
    });

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', measure => {
    const shape = doubter
      .object({
        foo: doubter.string(),
        bar: doubter.number(),
      })
      .exact();

    measure(() => {
      shape.parse(value);
    });
  });
});
