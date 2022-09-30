const Ajv = require('ajv');
const z = require('myzod');
const v = require('@badrap/valita');
const d = require('../../lib/index-cjs');

beforeBatch(gc);

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
      const type = z.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.string();

      measure(() => {
        type.safeParse(value);
      });
    });

    describe('invalid input', () => {
      test('doubter', measure => {
        const type = d.string();

        measure(() => {
          type.safeParse(111);
        });
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
      const type = z.string().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.string().length(3);

      measure(() => {
        type.safeParse(value);
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

    test('doubter', measure => {
      const type = d.integer();

      measure(() => {
        type.safeParse(value);
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
      const type = z.number();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.number();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.number();

      measure(() => {
        type.safeParse(value);
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
      const type = z.number().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.number().gte(1).lte(5);

      measure(() => {
        type.safeParse(value);
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
      const type = z.array(z.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.array(v.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.array(d.number());

      measure(() => {
        type.safeParse(value);
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
      const type = z.array(z.number()).length(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.array(d.number()).length(3);

      measure(() => {
        type.safeParse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'array(number().gte(0)).length(3)',
  () => {
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

    test('myzod', measure => {
      const type = z.array(z.number().min(0).max(10)).length(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.array(d.number().gte(0).lte(10)).length(3);

      measure(() => {
        type.safeParse(value);
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
      const type = z.tuple([z.number(), z.number()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.tuple([v.number(), v.number()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.tuple([d.number(), d.number()]);

      measure(() => {
        type.safeParse(value);
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
      const type = z.record(z.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.record(v.number());

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.record(d.string(), d.number());

      measure(() => {
        type.safeParse(value);
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
      const type = z.object(
        {
          foo: z.string(),
          bar: z.number(),
        },
        {
          allowUnknown: true,
        }
      );

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.object({
        foo: v.string(),
        bar: v.number(),
      });

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.object({
        foo: d.string(),
        bar: d.number(),
      });

      measure(() => {
        type.safeParse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'or([string(), number()])',
  () => {
    const createTests = value => {
      // test('Ajv', measure => {
      //   const ajv = new Ajv({ allowUnionTypes: true });
      //
      //   const schema = {
      //     $id: 'AjvTest',
      //     $schema: 'http://json-schema.org/draft-07/schema#',
      //     type: ['string', 'number'],
      //   };
      //
      //   const validate = ajv.compile(schema);
      //
      //   measure(() => {
      //     validate(value);
      //   });
      // });
      //
      // test('myzod', measure => {
      //   const type = z.union([z.string(), z.number()]);
      //
      //   measure(() => {
      //     type.parse(value);
      //   });
      // });

      test('valita', measure => {
        const type = v.union(v.string(), v.number());

        measure(() => {
          type.parse(value);
        });
      });

      test('doubter', measure => {
        const type = d.or([d.string(), d.number()]);

        measure(() => {
          type.safeParse(value);
        });
      });
    };

    describe('string input', () => createTests('aaa'));

    describe('number input', () => createTests(111));
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'huge object',
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
      const type = z.object(
        {
          a1: z.number(),
          a2: z.number(),
          a3: z.number(),
          a4: z.string(),
          a5: z.string(),
          a6: z.boolean(),
          a7: z.object(
            {
              a71: z.string(),
              a72: z.number(),
              a73: z.boolean(),
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

    test('valita', measure => {
      const type = v.object({
        a1: v.number(),
        a2: v.number(),
        a3: v.number(),
        a4: v.string(),
        a5: v.string(),
        a6: v.boolean(),
        a7: v.object({
          a71: v.string(),
          a72: v.number(),
          a73: v.boolean(),
        }),
      });

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const type = d.object({
        a1: d.number(),
        a2: d.number(),
        a3: d.number(),
        a4: d.string(),
        a5: d.string(),
        a6: d.boolean(),
        a7: d.object({
          a71: d.string(),
          a72: d.number(),
          a73: d.boolean(),
        }),
      });

      measure(() => {
        type.safeParse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
