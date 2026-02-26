import { describe, measure, test } from 'toofast';
import { Ajv } from 'ajv';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.js';

describe('set(number())', () => {
  const value = new Set([111, 222]);
  const ajvValue = Array.from(value);

  test('Ajv', () => {
    const ajv = new Ajv();

    const schema = {
      $id: 'test',
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: {
        type: 'number',
      },
      uniqueItems: true,
    };

    const validate = ajv.compile(schema);

    measure(() => {
      validate(ajvValue);
    });
  });

  test('zod', () => {
    const type = zod.set(zod.number());

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.set(doubter.number());

    measure(() => {
      shape.parse(value);
    });
  });
});
