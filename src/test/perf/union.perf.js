import { describe, measure, test } from 'toofast';
import * as valita from '@badrap/valita';
import { Ajv } from 'ajv';
import * as myzod from 'myzod';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.js';

describe('or([string(), number(), boolean()])', () => {
  const createTests = value => {
    test('Ajv', () => {
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

    test('zod', () => {
      const type = zod.union([zod.string(), zod.number(), zod.boolean()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.union([myzod.string(), myzod.number(), myzod.boolean()]);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.union(valita.string(), valita.number(), valita.boolean());

      measure(() => {
        type.parse(value);
      });
    });

    test('doubter', () => {
      const shape = doubter.or([doubter.string(), doubter.number(), doubter.boolean()]);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('"aaa"', () => createTests('aaa'));

  describe('111', () => createTests(111));

  describe('true', () => createTests(true));
});

describe('or([object({ foo: string() }), object({ bar: number() })])', () => {
  const createTests = value => {
    test('Ajv', () => {
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

    test('zod', () => {
      const type = zod.union([
        zod.object({ foo: zod.string() }).passthrough(),
        zod.object({ bar: zod.number() }).passthrough(),
      ]);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.union([
        myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
        myzod.object({ bar: myzod.number() }, { allowUnknown: true }),
      ]);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.union(valita.object({ foo: valita.string() }), valita.object({ bar: valita.number() }));
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', () => {
      const shape = doubter.or([doubter.object({ foo: doubter.string() }), doubter.object({ bar: doubter.number() })]);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('{ foo: "aaa" }', () => createTests({ foo: 'aaa' }));

  describe('{ bar: 123 }', () => createTests({ bar: 123 }));
});

describe('or([object({ foo: string() }), array(number())])', () => {
  const createTests = value => {
    test('Ajv', () => {
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

    test('zod', () => {
      const type = zod.union([zod.object({ foo: zod.string() }).passthrough(), zod.array(zod.number())]);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.union([
        myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
        myzod.array(myzod.number()),
      ]);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.union(valita.object({ foo: valita.string() }), valita.array(valita.number()));
      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', () => {
      const shape = doubter.or([doubter.object({ foo: doubter.string() }), doubter.array(doubter.number())]);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('{ foo: "aaa" }', () => createTests({ foo: 'aaa' }));

  describe('[123]', () => createTests([123]));
});

describe('or([object({ type: const("foo") }), object({ type: const("bar") })])', () => {
  const createTests = value => {
    test('Ajv', () => {
      const ajv = new Ajv({ allowUnionTypes: true });

      const schema = {
        $id: 'test',
        $schema: 'http://json-schema.org/draft-07/schema#',
        anyOf: [
          {
            type: 'object',
            properties: {
              type: { const: 'foo' },
            },
            required: ['type'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'bar' },
            },
            required: ['type'],
          },
        ],
      };

      const validate = ajv.compile(schema);

      measure(() => {
        validate(value);
      });
    });

    test('zod', () => {
      const type = zod.discriminatedUnion('type', [
        zod.object({ type: zod.literal('foo') }).passthrough(),
        zod.object({ type: zod.literal('bar') }).passthrough(),
      ]);

      measure(() => {
        type.parse(value);
      });
    });

    test('myzod', () => {
      const type = myzod.union([
        myzod.object({ type: myzod.literal('foo') }, { allowUnknown: true }),
        myzod.object({ type: myzod.literal('bar') }, { allowUnknown: true }),
      ]);

      measure(() => {
        type.parse(value);
      });
    });

    test('valita', () => {
      const type = valita.union(
        valita.object({ type: valita.literal('foo') }),
        valita.object({ type: valita.literal('bar') })
      );

      const options = { mode: 'passthrough' };

      measure(() => {
        type.parse(value, options);
      });
    });

    test('doubter', () => {
      const shape = doubter.or([
        doubter.object({ type: doubter.const('foo') }),
        doubter.object({ type: doubter.const('bar') }),
      ]);

      measure(() => {
        shape.parse(value);
      });
    });
  };

  describe('{ type: "foo" }', () => createTests({ type: 'foo' }));

  describe('{ type: "bar" }', () => createTests({ type: 'bar' }));
});
