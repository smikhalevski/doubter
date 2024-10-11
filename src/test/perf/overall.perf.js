const Ajv = require('ajv');
const zod = require('zod');
const myzod = require('myzod');
const valita = require('@badrap/valita');
const valibot = require('valibot');
const doubter = require('../../../lib');

describe('Overall', () => {
  const createOverallTests = (isSuccessMeasureEnabled, isFailureMeasureEnabled) => {
    const validValue = {
      a1: [1, 2, 3],
      a2: 'foo',
      a3: false,
      a4: {
        a41: 'bar',
        a42: 3.1415,
      },
    };

    const invalidValue = {
      a1: [1, 2, '3'],
      a2: 0xf00,
      a3: false,
      a4: {
        a41: 'bar',
        a42: '3.1415',
      },
    };

    describe('Loose validation', () => {
      test('doubter', measure => {
        const shape = doubter.object({
          a1: doubter.array(doubter.number().int()),
          a2: doubter.string().min(3),
          a3: doubter.boolean(),
          a4: doubter.object({
            a41: doubter.enum(['foo', 'bar']),
            a42: doubter.number(),
          }),
        });

        if (isSuccessMeasureEnabled) {
          measure(() => {
            shape.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            shape.try(invalidValue);
          });
        }
      });

      test('Ajv', measure => {
        const ajv = new Ajv();

        const schema = {
          $id: 'test',
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            a1: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
            a2: {
              type: 'string',
              minLength: 3,
            },
            a3: {
              type: 'boolean',
            },
            a4: {
              type: 'object',
              properties: {
                a41: {
                  enum: ['foo', 'bar'],
                },
                a42: {
                  type: 'number',
                },
              },
              required: ['a41', 'a42'],
            },
          },
          required: ['a1', 'a2', 'a3', 'a4'],
        };

        const validate = ajv.compile(schema);

        if (isSuccessMeasureEnabled) {
          measure(() => {
            validate(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            validate(invalidValue);
          });
        }
      });

      test('zod', measure => {
        const type = zod
          .object({
            a1: zod.array(zod.number().int()),
            a2: zod.string().min(3),
            a3: zod.boolean(),
            a4: zod
              .object({
                a41: zod.enum(['foo', 'bar']),
                a42: zod.number(),
              })
              .passthrough(),
          })
          .passthrough();

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.safeParse(invalidValue);
          });
        }
      });

      test('myzod', measure => {
        const type = myzod.object(
          {
            a1: myzod.array(myzod.number().withPredicate(Number.isInteger)),
            a2: myzod.string().min(3),
            a3: myzod.boolean(),
            a4: myzod.object(
              {
                a41: myzod.enum(['foo', 'bar']),
                a42: myzod.number(),
              },
              { allowUnknown: true }
            ),
          },
          { allowUnknown: true }
        );

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.try(invalidValue);
          });
        }
      });

      test('valita', measure => {
        const type = valita.object({
          a1: valita.array(valita.number().assert(Number.isInteger)),
          a2: valita.string().assert(value => value.length >= 3),
          a3: valita.boolean(),
          a4: valita.object({
            a41: valita.union(valita.literal('foo'), valita.literal('bar')),
            a42: valita.number(),
          }),
        });

        const options = { mode: 'passthrough' };

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue, options);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.try(invalidValue, options).issues;
          });
        }
      });

      test('valibot', measure => {
        const schema = valibot.object({
          a1: valibot.array(valibot.number([valibot.integer()])),
          a2: valibot.string([valibot.minLength(3)]),
          a3: valibot.boolean(),
          a4: valibot.object({
            a41: valibot.picklist(['foo', 'bar']),
            a42: valibot.number(),
          }),
        });

        if (isSuccessMeasureEnabled) {
          measure(() => {
            valibot.parse(schema, validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            valibot.safeParse(schema, validValue);
          });
        }
      });
    });

    describe('Strict validation', () => {
      test('doubter', measure => {
        const shape = doubter
          .object({
            a1: doubter.array(doubter.number().int()),
            a2: doubter.string().min(3),
            a3: doubter.boolean(),
            a4: doubter
              .object({
                a41: doubter.enum(['foo', 'bar']),
                a42: doubter.number(),
              })
              .exact(),
          })
          .exact();

        if (isSuccessMeasureEnabled) {
          measure(() => {
            shape.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            shape.try(invalidValue);
          });
        }
      });

      test('Ajv', measure => {
        const ajv = new Ajv();

        const schema = {
          $id: 'test',
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            a1: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
            a2: {
              type: 'string',
              minLength: 3,
            },
            a3: {
              type: 'boolean',
            },
            a4: {
              type: 'object',
              properties: {
                a41: {
                  enum: ['foo', 'bar'],
                },
                a42: {
                  type: 'number',
                },
              },
              required: ['a41', 'a42'],
              additionalProperties: false,
            },
          },
          required: ['a1', 'a2', 'a3', 'a4'],
          additionalProperties: false,
        };

        const validate = ajv.compile(schema);

        if (isSuccessMeasureEnabled) {
          measure(() => {
            validate(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            validate(invalidValue);
          });
        }
      });

      test('zod', measure => {
        const type = zod.object({
          a1: zod.array(zod.number().int()),
          a2: zod.string().min(3),
          a3: zod.boolean(),
          a4: zod.object({
            a41: zod.enum(['foo', 'bar']),
            a42: zod.number(),
          }),
        });

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.safeParse(invalidValue);
          });
        }
      });

      test('myzod', measure => {
        const type = myzod.object({
          a1: myzod.array(myzod.number().withPredicate(Number.isInteger)),
          a2: myzod.string().min(3),
          a3: myzod.boolean(),
          a4: myzod.object({
            a41: myzod.enum(['foo', 'bar']),
            a42: myzod.number(),
          }),
        });

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.try(invalidValue);
          });
        }
      });

      test('valita', measure => {
        const type = valita.object({
          a1: valita.array(valita.number().assert(Number.isInteger)),
          a2: valita.string().assert(value => value.length >= 3),
          a3: valita.boolean(),
          a4: valita.object({
            a41: valita.union(valita.literal('foo'), valita.literal('bar')),
            a42: valita.number(),
          }),
        });

        if (isSuccessMeasureEnabled) {
          measure(() => {
            type.parse(validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            type.try(invalidValue).issues;
          });
        }
      });

      test('valibot', measure => {
        const schema = valibot.object(
          {
            a1: valibot.array(valibot.number([valibot.integer()])),
            a2: valibot.string([valibot.minLength(3)]),
            a3: valibot.boolean(),
            a4: valibot.object({
              a41: valibot.picklist(['foo', 'bar']),
              a42: valibot.number(),
            }),
          },
          valibot.never()
        );

        if (isSuccessMeasureEnabled) {
          measure(() => {
            valibot.parse(schema, validValue);
          });
        }

        if (isFailureMeasureEnabled) {
          measure(() => {
            valibot.safeParse(schema, validValue);
          });
        }
      });
    });
  };

  describe('Success path', () => createOverallTests(true, false));

  describe('Failure path', () => createOverallTests(false, true));
});

describe('https://moltar.github.io/typescript-runtime-type-benchmarks/', () => {
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

  describe('Loose validation', () => {
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

    test('valibot', measure => {
      const schema = valibot.object({
        a1: valibot.number(),
        a2: valibot.number(),
        a3: valibot.number(),
        a4: valibot.string(),
        a5: valibot.string(),
        a6: valibot.boolean(),
        a7: valibot.object({
          a71: valibot.string(),
          a72: valibot.number(),
          a73: valibot.boolean(),
        }),
      });

      measure(() => {
        valibot.parse(schema, value);
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
  });

  describe('Strict validation', () => {
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
            additionalProperties: false,
          },
        },
        required: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
        additionalProperties: false,
      };

      const validate = ajv.compile(schema);

      measure(() => {
        validate(value);
      });
    });

    test('zod', measure => {
      const type = zod.object({
        a1: zod.number(),
        a2: zod.number(),
        a3: zod.number(),
        a4: zod.string(),
        a5: zod.string(),
        a6: zod.boolean(),
        a7: zod.object({
          a71: zod.string(),
          a72: zod.number(),
          a73: zod.boolean(),
        }),
      });

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', measure => {
      const type = myzod.object({
        a1: myzod.number(),
        a2: myzod.number(),
        a3: myzod.number(),
        a4: myzod.string(),
        a5: myzod.string(),
        a6: myzod.boolean(),
        a7: myzod.object({
          a71: myzod.string(),
          a72: myzod.number(),
          a73: myzod.boolean(),
        }),
      });

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

      measure(() => {
        type.parse(value);
      });
    });

    test('valibot', measure => {
      const schema = valibot.object(
        {
          a1: valibot.number(),
          a2: valibot.number(),
          a3: valibot.number(),
          a4: valibot.string(),
          a5: valibot.string(),
          a6: valibot.boolean(),
          a7: valibot.object({
            a71: valibot.string(),
            a72: valibot.number(),
            a73: valibot.boolean(),
          }),
        },
        valibot.never()
      );

      measure(() => {
        valibot.parse(schema, value);
      });
    });

    test('doubter', measure => {
      const shape = doubter
        .object({
          a1: doubter.number(),
          a2: doubter.number(),
          a3: doubter.number(),
          a4: doubter.string(),
          a5: doubter.string(),
          a6: doubter.boolean(),
          a7: doubter
            .object({
              a71: doubter.string(),
              a72: doubter.number(),
              a73: doubter.boolean(),
            })
            .exact(),
        })
        .exact();

      measure(() => {
        shape.parse(value);
      });
    });
  });
});
