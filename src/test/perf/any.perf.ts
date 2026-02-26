import { describe, test, measure } from 'toofast';
import * as valita from '@badrap/valita';
import * as doubter from '../../../lib/index.js';

describe('any().check(Number.isNaN)', () => {
  test('valita', () => {
    const type = valita.unknown().assert(Number.isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', () => {
    const shape = doubter.any().check(v => (Number.isNaN(v) ? null : []));

    measure(() => {
      shape.parse(NaN);
    });
  });
});

describe('any().refine(Number.isNaN)', () => {
  test('valita', () => {
    const type = valita.unknown().assert(Number.isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', () => {
    const shape = doubter.any().refine(Number.isNaN);

    measure(() => {
      shape.parse(NaN);
    });
  });
});
