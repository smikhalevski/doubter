const Ajv = require('ajv');
const myzod = require('myzod');
const lib = require('../../lib/index-cjs');

describe(
  'Unconstrained string',
  () => {
    const value = 'aaa';

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
  'String',
  () => {
    const value = 'aaa';

    test('myzod', measure => {
      const type = myzod.string().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.string().min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Unconstrained integer',
  () => {
    const value = 4;

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
  'Unconstrained number',
  () => {
    const value = 4;

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
  'Number',
  () => {
    const value = 4;

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
  'Unconstrained array',
  () => {
    const value = [1, 2, 3];

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
  'Array',
  () => {
    const value = [1, 2, 3];

    test('myzod', measure => {
      const type = myzod.array(myzod.number()).min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.array(lib.number()).min(1).max(5);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Unconstrained tuple',
  () => {
    const value = [1, 2, 3];

    test('myzod', measure => {
      const type = myzod.tuple([myzod.number(), myzod.number(), myzod.number()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('lib', measure => {
      const type = lib.tuple([lib.number(), lib.number(), lib.number()]);

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Unconstrained record',
  () => {
    const value = { a: 1, b: 2, c: 3 };

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
  'Object',
  () => {
    const value = {
      aaa: 'aaa',
      bbb: 'bbb',
      ccc: 'ccc',
    };

    test('Ajv', measure => {
      const ajv = new Ajv();

      const schema = {
        $id: 'AjvTest',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          aaa: {
            type: 'string',
          },
          bbb: {
            type: 'string',
          },
          ccc: {
            type: 'string',
          },
        },
        required: ['aaa', 'bbb', 'ccc'],
      };

      const validate = ajv.compile(schema);

      measure(() => {
        validate(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.object(
        {
          aaa: myzod.string(),
          bbb: myzod.string(),
          ccc: myzod.string(),
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
        aaa: lib.string({ message: 'qweqwe' }),
        bbb: lib.string(),
        ccc: lib.string(),
      });

      measure(() => {
        type.parse(value);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'External test',
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
