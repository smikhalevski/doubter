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
      const shape = d.string();

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.StringShape', measure => {
      const shape = new d.v3.StringShape();

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

      test('myzod', measure => {
        const type = z.string();

        measure(() => {
          try {
            type.parse(value);
          } catch {}
        });
      });

      test('valita', measure => {
        const type = v.string();

        measure(() => {
          type.try(value).issues;
        });
      });

      test('doubter', measure => {
        const shape = d.string();

        measure(() => {
          shape.safeParse(value);
        });
      });

      test('doubter.v3.StringShape', measure => {
        const shape = new d.v3.StringShape();

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

    test('myzod', measure => {
      const type = z.string().min(3).max(3);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.string().assert(v => v.length === 3);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = d.string().length(3);

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.StringShape', measure => {
      const shape = new d.v3.StringShape().length(3);

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

      test('myzod', measure => {
        const type = z.string().min(3).max(3);

        measure(() => {
          try {
            type.parse(value);
          } catch {}
        });
      });

      test('valita', measure => {
        const type = v.string().assert(v => v.length === 3);

        measure(() => {
          type.try(value).issues;
        });
      });

      test('doubter', measure => {
        const shape = d.string().length(3);

        measure(() => {
          shape.safeParse(value);
        });
      });

      test('doubter.v3.StringShape', measure => {
        const shape = new d.v3.StringShape().length(3);

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
      const shape = d.integer();

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.number();

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.NumberShape', measure => {
      const shape = new d.v3.NumberShape();

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

    test('myzod', measure => {
      const type = z.number().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', measure => {
      const shape = d.number().gte(1).lte(5);

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.array(d.number());

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.array(d.number()).length(3);

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.array(d.number().gte(0).lte(10)).length(3);

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.tuple([d.number(), d.number()]);

      measure(() => {
        shape.safeParse(value);
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
      const shape = d.record(d.string(), d.number());

      measure(() => {
        shape.safeParse(value);
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

      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', measure => {
      const shape = d.object({
        foo: d.string(),
        bar: d.number(),
      });

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.ObjectShape', measure => {
      const shape = new d.v3.ObjectShape({
        foo: new d.v3.StringShape(),
        bar: new d.v3.NumberShape(),
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

    test('valita', measure => {
      const type = v.object({ foo: v.string() }).rest(v.string());
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', measure => {
      const shape = d.object({ foo: d.string() }).index(d.string());

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.ObjectShape', measure => {
      const shape = new d.v3.ObjectShape({ foo: new d.v3.StringShape() }).rest(new d.v3.StringShape());

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

    test('myzod', measure => {
      const type = z.object({
        foo: z.string(),
        bar: z.number(),
      });

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', measure => {
      const type = v.object({
        foo: v.string(),
        bar: v.number(),
      });
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', measure => {
      const shape = d.object({ foo: d.string(), bar: d.number() }).exact();

      measure(() => {
        shape.safeParse(value);
      });
    });

    test('doubter.v3.ObjectShape', measure => {
      const shape = new d.v3.ObjectShape({
        foo: new d.v3.StringShape(),
        bar: new d.v3.NumberShape(),
      }).exact();

      measure(() => {
        shape.parse(value);
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
      //     $id: 'test',
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
        const shape = d.or([d.string(), d.number()]);

        measure(() => {
          shape.safeParse(value);
        });
      });
    };

    describe('string input', () => createTests('aaa'));

    describe('number input', () => createTests(111));
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
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', measure => {
      const shape = d.object({
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
        shape.safeParse(value);
      });
    });

    test('doubter.v3.ObjectShape', measure => {
      const shape = new d.v3.ObjectShape({
        a1: new d.v3.NumberShape(),
        a2: new d.v3.NumberShape(),
        a3: new d.v3.NumberShape(),
        a4: new d.v3.StringShape(),
        a5: new d.v3.StringShape(),
        a6: new d.v3.BooleanShape(),
        a7: new d.v3.ObjectShape({
          a71: new d.v3.StringShape(),
          a72: new d.v3.NumberShape(),
          a73: new d.v3.BooleanShape(),
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

    test('valita', measure => {
      const typeA = v.object({
        a1: v.number(),
        a2: v.boolean(),
        a3: v.string(),
        a4: v.object({
          a41: v.boolean(),
          a42: v.string(),
          a43: v.number(),
        }),
      });

      const typeB = v.object({
        b1: v.string(),
        b2: v.number(),
        b3: v.object({
          b31: v.string(),
          b32: v.number(),
        }),
        b4: v.string(),
        b5: v.boolean(),
      });

      measure(() => {
        typeA.parse(valueA);
        typeB.parse(valueB);
      });
    });

    test('doubter', measure => {
      const shapeA = d
        .object({
          a1: d.number(),
          a2: d.boolean(),
          a3: d.string(),
          a4: d
            .object({
              a41: d.boolean(),
              a42: d.string(),
              a43: d.number(),
            })
            .exact(),
        })
        .exact();

      const shapeB = d
        .object({
          b1: d.string(),
          b2: d.number(),
          b3: d
            .object({
              b31: d.string(),
              b32: d.number(),
            })
            .exact(),
          b4: d.string(),
          b5: d.boolean(),
        })
        .exact();

      measure(() => {
        shapeA.safeParse(valueA);
        shapeB.safeParse(valueB);
      });
    });

    test('doubter.v3.ObjectShape', measure => {
      const shapeA = new d.v3.ObjectShape({
        a1: new d.v3.NumberShape(),
        a2: new d.v3.BooleanShape(),
        a3: new d.v3.StringShape(),
        a4: new d.v3.ObjectShape({
          a41: new d.v3.BooleanShape(),
          a42: new d.v3.StringShape(),
          a43: new d.v3.NumberShape(),
        }).exact(),
      }).exact();

      const shapeB = new d.v3.ObjectShape({
        b1: new d.v3.StringShape(),
        b2: new d.v3.NumberShape(),
        b3: new d.v3.ObjectShape({
          b31: new d.v3.StringShape(),
          b32: new d.v3.NumberShape(),
        }).exact(),
        b4: new d.v3.StringShape(),
        b5: new d.v3.BooleanShape(),
      }).exact();

      measure(() => {
        shapeA.parse(valueA);
        shapeB.parse(valueB);
      });
    });
  },
  { warmupIterationCount: 1000, targetRme: 0.002 }
);
