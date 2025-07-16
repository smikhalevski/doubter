import { describe, measure, test } from 'toofast';
import * as valita from '@badrap/valita';
import { Ajv } from 'ajv';
import * as myzod from 'myzod';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.js';

describe('number()', () => {
  const value = 4;

  test('Ajv', () => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'number',
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', () => {
    const type = zod.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', () => {
    const type = valita.number();

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.number();

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().multipleOf(1)', () => {
  const value = 49;

  test('Ajv', () => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'number',
      multipleOf: 1,
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', () => {
    const type = zod.number().multipleOf(1);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.number().multipleOf(1);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().gte(1).lte(5)', () => {
  const value = 4;

  test('Ajv', () => {
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

  test('zod', () => {
    const type = zod.number().min(1).max(5);

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.number().min(1).max(5);

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.number().gte(1).lte(5);

    measure(() => {
      shape.parse(value);
    });
  });
});

describe('number().int()', () => {
  const value = 4;

  test('Ajv', () => {
    const validate = new Ajv().compile({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'integer',
    });

    measure(() => {
      validate(value);
    });
  });

  test('zod', () => {
    const type = zod.number().int();

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.number().int();

    measure(() => {
      shape.parse(value);
    });
  });
});
