const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const doubter = require('../../lib/index-cjs');

beforeBatch(gc);

describe(
  'string().optional()',
  () => {
    const value = 'aaa';

    test('zod', measure => {
      const type = zod.string().optional();

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().optional();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string().optional();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().optional();

      measure(() => {
        shape.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'string().pipe(string())',
  () => {
    const value = 'aaa';

    test('doubter', measure => {
      const shape = doubter.string().pipe(doubter.string());

      measure(() => {
        shape.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'string().transform(() => 111)',
  () => {
    const value = 'aaa';

    test('zod', measure => {
      const type = zod.string().transform(() => 111);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().map(() => 111);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string().map(() => 111);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().transform(() => 111);

      measure(() => {
        shape.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

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

    test('zod', measure => {
      const type = zod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string();

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string();

      measure(() => {
        shape.parse(value);
      });
    });

    describe('invalid input', () => {
      const value = 111;

      test('Ajv', measure => {
        const validate = new Ajv().compile({
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'string',
        });

        measure(() => {
          validate(value);
        });
      });

      test('zod', measure => {
        const type = zod.string();

        measure(() => {
          type.safeParse(value);
        });
      });

      test('myzod', measure => {
        const type = myzod.string();

        measure(() => {
          try {
            type.parse(value);
          } catch {}
        });
      });

      test('valita', measure => {
        const type = valita.string();

        measure(() => {
          type.try(value);
        });
      });

      test('doubter', measure => {
        const shape = doubter.string();

        measure(() => {
          shape.try(value);
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

    test('zod', measure => {
      const type = zod.string().length(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.string().assert(v => v.length === 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = doubter.string().length(3);

      measure(() => {
        shape.parse(value);
      });
    });

    describe('invalid input', () => {
      const value = 'aaaa';

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

      test('zod', measure => {
        const type = zod.string().length(3);

        measure(() => {
          type.safeParse(value);
        });
      });

      test('myzod', measure => {
        const type = myzod.string().min(3).max(3);

        measure(() => {
          try {
            type.parse(value);
          } catch {}
        });
      });

      test('valita', measure => {
        const type = valita.string().assert(v => v.length === 3);

        measure(() => {
          type.try(value);
        });
      });

      test('doubter', measure => {
        const shape = doubter.string().length(3);

        measure(() => {
          shape.try(value);
        });
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
      const shape = doubter.integer();

      measure(() => {
        shape.parse(value);
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
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'array(number().gte(0).lte(10)).length(3)',
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

    test('doubter', measure => {
      const shape = doubter.array(doubter.number().gte(0).lte(10)).length(3);

      measure(() => {
        shape.parse(value);
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
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'object({ foo: string() }).rest(string())',
  () => {
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
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'object({ foo: string(), bar: number() }).exact()',
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
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'or([string(), number(), boolean()])',
  () => {
    const createTests = value => {
      test('Ajv', measure => {
        const ajv = new Ajv({ allowUnionTypes: true });

        const schema = {
          $id: 'test',
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: ['string', 'number', 'boolean'],
        };

        const validate = ajv.compile(schema);

        measure(() => {
          validate(value);
        });
      });

      test('zod', measure => {
        const type = zod.union([zod.string(), zod.number(), zod.boolean()]);

        measure(() => {
          type.parse(value);
        });
      });

      test('myzod', measure => {
        const type = myzod.union([myzod.string(), myzod.number(), myzod.boolean()]);

        measure(() => {
          type.parse(value);
        });
      });

      test('valita', measure => {
        const type = valita.union(valita.string(), valita.number(), valita.boolean());

        measure(() => {
          type.parse(value);
        });
      });

      test('doubter', measure => {
        const shape = doubter.or([doubter.string(), doubter.number(), doubter.boolean()]);

        measure(() => {
          shape.parse(value);
        });
      });
    };

    describe('string input', () => createTests('aaa'));

    describe('number input', () => createTests(111));

    describe('boolean input', () => createTests(true));
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'or([object({ foo: string() }), object({ bar: number() })])',
  () => {
    const createTests = value => {
      test('Ajv', measure => {
        const ajv = new Ajv({ allowUnionTypes: true });

        const schema = {
          $id: 'test',
          $schema: 'http://json-schema.org/draft-07/schema#',
          anyOf: [
            {
              type: 'object',
              properties: {
                foo: { type: 'string' },
              },
              required: ['foo'],
            },
            {
              type: 'object',
              properties: {
                bar: { type: 'number' },
              },
              required: ['bar'],
            },
          ],
        };

        const validate = ajv.compile(schema);

        measure(() => {
          validate(value);
        });
      });

      test('zod', measure => {
        const type = zod.union([
          zod.object({ foo: zod.string() }).passthrough(),
          zod.object({ bar: zod.number() }).passthrough(),
        ]);

        measure(() => {
          type.parse(value);
        });
      });

      test('myzod', measure => {
        const type = myzod.union([
          myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
          myzod.object({ bar: myzod.number() }, { allowUnknown: true }),
        ]);

        measure(() => {
          type.parse(value);
        });
      });

      test('valita', measure => {
        const type = valita.union(valita.object({ foo: valita.string() }), valita.object({ bar: valita.number() }));
        const options = { mode: 'passthrough' };

        measure(() => {
          type.parse(value, options);
        });
      });

      test('doubter', measure => {
        const shape = doubter.or([
          doubter.object({ foo: doubter.string() }),
          doubter.object({ bar: doubter.number() }),
        ]);

        measure(() => {
          shape.parse(value);
        });
      });
    };

    describe('{ foo: "aaa" }', () => createTests({ foo: 'aaa' }));

    describe('{ bar: 123 }', () => createTests({ bar: 123 }));
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'or([object({ foo: string() }), array(number())])',
  () => {
    const createTests = value => {
      test('Ajv', measure => {
        const ajv = new Ajv({ allowUnionTypes: true });

        const schema = {
          $id: 'test',
          $schema: 'http://json-schema.org/draft-07/schema#',
          anyOf: [
            {
              type: 'object',
              properties: {
                foo: { type: 'string' },
              },
              required: ['foo'],
            },
            {
              type: 'array',
              items: {
                type: 'number',
              },
            },
          ],
        };

        const validate = ajv.compile(schema);

        measure(() => {
          validate(value);
        });
      });

      test('zod', measure => {
        const type = zod.union([zod.object({ foo: zod.string() }).passthrough(), zod.array(zod.number())]);

        measure(() => {
          type.parse(value);
        });
      });

      test('myzod', measure => {
        const type = myzod.union([
          myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
          myzod.array(myzod.number()),
        ]);

        measure(() => {
          type.parse(value);
        });
      });

      test('valita', measure => {
        const type = valita.union(valita.object({ foo: valita.string() }), valita.array(valita.number()));
        const options = { mode: 'passthrough' };

        measure(() => {
          type.parse(value, options);
        });
      });

      test('doubter', measure => {
        const shape = doubter.or([doubter.object({ foo: doubter.string() }), doubter.array(doubter.number())]);

        measure(() => {
          shape.parse(value);
        });
      });
    };

    describe('{ foo: "aaa" }', () => createTests({ foo: 'aaa' }));

    describe('[123]', () => createTests([123]));
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'nested objects',
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
        $id: 'test',
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

    test('zod', measure => {
      const type = zod
        .object({
          a1: zod.number(),
          a2: zod.number(),
          a3: zod.number(),
          a4: zod.string(),
          a5: zod.string(),
          a6: zod.boolean(),
          a7: zod
            .object({
              a71: zod.string(),
              a72: zod.number(),
              a73: zod.boolean(),
            })
            .passthrough(),
        })
        .passthrough();

      measure(() => {
        type.parse(value);
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
            { allowUnknown: true }
          ),
        },
        { allowUnknown: true }
      );

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = valita.object({
        a1: valita.number(),
        a2: valita.number(),
        a3: valita.number(),
        a4: valita.string(),
        a5: valita.string(),
        a6: valita.boolean(),
        a7: valita.object({
          a71: valita.string(),
          a72: valita.number(),
          a73: valita.boolean(),
        }),
      });
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', measure => {
      const shape = doubter.object({
        a1: doubter.number(),
        a2: doubter.number(),
        a3: doubter.number(),
        a4: doubter.string(),
        a5: doubter.string(),
        a6: doubter.boolean(),
        a7: doubter.object({
          a71: doubter.string(),
          a72: doubter.number(),
          a73: doubter.boolean(),
        }),
      });

      measure(() => {
        shape.parse(value);
      });
    });
  },
  { warmupIterationCount: 1000, targetRme: 0.002 }
);

describe(
  'exact nested objects',
  () => {
    const valueA = {
      a1: 111,
      a2: true,
      a3: 'aaa',
      a4: {
        a41: true,
        a42: 'bbb',
        a43: 222,
      },
    };

    const valueB = {
      b1: 'aaa',
      b2: 111,
      b3: {
        b31: 'bbb',
        b32: 222,
      },
      b4: 'ccc',
      b5: true,
    };

    test('Ajv', measure => {
      const ajv = new Ajv();

      const schemaA = {
        $id: 'testA',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          a1: {
            type: 'number',
          },
          a2: {
            type: 'boolean',
          },
          a3: {
            type: 'string',
          },
          a4: {
            type: 'object',
            properties: {
              a41: {
                type: 'boolean',
              },
              a42: {
                type: 'string',
              },
              a43: {
                type: 'number',
              },
            },
            additionalProperties: false,
            required: ['a41', 'a42', 'a43'],
          },
        },
        additionalProperties: false,
        required: ['a1', 'a2', 'a3', 'a4'],
      };

      const schemaB = {
        $id: 'testB',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          b1: {
            type: 'string',
          },
          b2: {
            type: 'number',
          },
          b3: {
            type: 'object',
            properties: {
              b31: {
                type: 'string',
              },
              b32: {
                type: 'number',
              },
            },
            additionalProperties: false,
            required: ['b31', 'b32'],
          },
          b4: {
            type: 'string',
          },
          b5: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
        required: ['b1', 'b2', 'b3', 'b4', 'b5'],
      };

      const validateA = ajv.compile(schemaA);
      const validateB = ajv.compile(schemaB);

      measure(() => {
        validateA(valueA);
        validateB(valueB);
      });
    });

    test('zod', measure => {
      const typeA = zod
        .object({
          a1: zod.number(),
          a2: zod.boolean(),
          a3: zod.string(),
          a4: zod
            .object({
              a41: zod.boolean(),
              a42: zod.string(),
              a43: zod.number(),
            })
            .strict(),
        })
        .strict();

      const typeB = zod
        .object({
          b1: zod.string(),
          b2: zod.number(),
          b3: zod
            .object({
              b31: zod.string(),
              b32: zod.number(),
            })
            .strict(),
          b4: zod.string(),
          b5: zod.boolean(),
        })
        .strict();

      measure(() => {
        typeA.parse(valueA);
        typeB.parse(valueB);
      });
    });

    test('myzod', measure => {
      const typeA = myzod.object({
        a1: myzod.number(),
        a2: myzod.boolean(),
        a3: myzod.string(),
        a4: myzod.object({
          a41: myzod.boolean(),
          a42: myzod.string(),
          a43: myzod.number(),
        }),
      });

      const typeB = myzod.object({
        b1: myzod.string(),
        b2: myzod.number(),
        b3: myzod.object({
          b31: myzod.string(),
          b32: myzod.number(),
        }),
        b4: myzod.string(),
        b5: myzod.boolean(),
      });

      measure(() => {
        typeA.parse(valueA);
        typeB.parse(valueB);
      });
    });

    test('valita', measure => {
      const typeA = valita.object({
        a1: valita.number(),
        a2: valita.boolean(),
        a3: valita.string(),
        a4: valita.object({
          a41: valita.boolean(),
          a42: valita.string(),
          a43: valita.number(),
        }),
      });

      const typeB = valita.object({
        b1: valita.string(),
        b2: valita.number(),
        b3: valita.object({
          b31: valita.string(),
          b32: valita.number(),
        }),
        b4: valita.string(),
        b5: valita.boolean(),
      });

      measure(() => {
        typeA.parse(valueA);
        typeB.parse(valueB);
      });
    });

    test('doubter', measure => {
      const shapeA = doubter
        .object({
          a1: doubter.number(),
          a2: doubter.boolean(),
          a3: doubter.string(),
          a4: doubter
            .object({
              a41: doubter.boolean(),
              a42: doubter.string(),
              a43: doubter.number(),
            })
            .exact(),
        })
        .exact();

      const shapeB = doubter
        .object({
          b1: doubter.string(),
          b2: doubter.number(),
          b3: doubter
            .object({
              b31: doubter.string(),
              b32: doubter.number(),
            })
            .exact(),
          b4: doubter.string(),
          b5: doubter.boolean(),
        })
        .exact();

      measure(() => {
        shapeA.parse(valueA);
        shapeB.parse(valueB);
      });
    });
  },
  { warmupIterationCount: 1000, targetRme: 0.002 }
);
