import { describe, measure, test } from 'toofast';
import * as valita from '@badrap/valita';
import { Ajv } from 'ajv';
import * as myzod from 'myzod';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.mjs';

describe('record(string(), number())', () => {
  const value = { a: 1, b: 2, c: 3 };

  test('Ajv', () => {
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

  test('zod', () => {
    const type = zod.record(zod.string(), zod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.record(myzod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('valita', () => {
    const type = valita.record(valita.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.record(doubter.string(), doubter.number());

    measure(() => {
      shape.parse(value);
    });
  });
});
