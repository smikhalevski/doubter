const Ajv = require('ajv');
const myzod = require('myzod');
const lib = require('../../lib/index-cjs');

describe(
  'string()',
  () => {
    const value = 'aaa';

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
      });

      measure(() => {
        validate(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.string();

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'string().length(3)',
  () => {
    const value = 'aaa';

    test('Ajv', measure => {
      const validate = new Ajv().compile({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'string',
        minLength: 3,
        maxLength: 3,
      });

      measure(() => {
        validate(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.string().length(3);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'integer()',
  () => {
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

    test('lib', measure => {
      const type = lib.integer();

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'number()',
  () => {
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

    test('myzod', measure => {
      const type = myzod.number();

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.number();

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'number().gte(1).lte(5)',
  () => {
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

    test('myzod', measure => {
      const type = myzod.number().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.number().gte(1).lte(5);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'array(number())',
  () => {
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

    test('myzod', measure => {
      const type = myzod.array(myzod.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.array(lib.number());

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'array(number()).length(3)',
  () => {
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

    test('myzod', measure => {
      const type = myzod.array(myzod.number()).length(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.array(lib.number()).length(3);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'tuple([number(), number()])',
  () => {
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

    test('myzod', measure => {
      const type = myzod.tuple([myzod.number(), myzod.number()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.tuple([lib.number(), lib.number()]);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'record(string(), number())',
  () => {
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

    test('myzod', measure => {
      const type = myzod.record(myzod.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.record(lib.string(), lib.number());

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'object({ foo: string(), bar: number() })',
  () => {
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

    test('myzod', measure => {
      const type = myzod.object(
        {
          foo: myzod.string(),
          bar: myzod.number(),
        },
        {
          allowUnknown: true,
        }
      );

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.object({
        foo: lib.string(),
        bar: lib.number(),
      });

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'https://moltar.github.io/typescript-runtime-type-benchmarks/',
  () => {
    const value = {
      a1: 1,
      a2: -1,
      a3: Number.MAX_VALUE,
      a4: 'foo',
      a5: 'bar',
      a6: true,
      a7: {
        a71: 'baz',
        a72: 1,
        a73: false,
      },
    };

    test('Ajv', measure => {
      const ajv = new Ajv();

      const schema = {
        $id: 'AjvTest',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          a1: {
            type: 'number',
          },
          a2: {
            type: 'number',
          },
          a3: {
            type: 'number',
          },
          a4: {
            type: 'string',
          },
          a5: {
            type: 'string',
          },
          a6: {
            type: 'boolean',
          },
          a7: {
            type: 'object',
            properties: {
              a71: {
                type: 'string',
              },
              a72: {
                type: 'number',
              },
              a73: {
                type: 'boolean',
              },
            },
            required: ['a71', 'a72', 'a73'],
          },
        },
        required: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
      };

      const validate = ajv.compile(schema);

      measure(() => {
        validate(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.object(
        {
          a1: myzod.number(),
          a2: myzod.number(),
          a3: myzod.number(),
          a4: myzod.string(),
          a5: myzod.string(),
          a6: myzod.boolean(),
          a7: myzod.object(
            {
              a71: myzod.string(),
              a72: myzod.number(),
              a73: myzod.boolean(),
            },
            {
              allowUnknown: true,
            }
          ),
        },
        {
          allowUnknown: true,
        }
      );

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.object({
        a1: lib.number(),
        a2: lib.number(),
        a3: lib.number(),
        a4: lib.string(),
        a5: lib.string(),
        a6: lib.boolean(),
        a7: lib.object({
          a71: lib.string(),
          a72: lib.number(),
          a73: lib.boolean(),
        }),
      });

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
