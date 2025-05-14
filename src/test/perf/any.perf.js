import { describe, test, measure } from 'toofast';
import * as valita from '@badrap/valita';
import * as doubter from '../../../lib/index.mjs';

describe('any().check(isNaN)', () => {
  test('valita', () => {
    const type = valita.unknown().assert(isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', () => {
    const shape = doubter.any().check(v => (isNaN(v) ? null : []));

    measure(() => {
      shape.parse(NaN);
    });
  });
});

describe('any().refine(isNaN)', () => {
  test('valita', () => {
    const type = valita.unknown().assert(isNaN);

    measure(() => {
      type.parse(NaN);
    });
  });

  test('doubter', () => {
    const shape = doubter.any().refine(isNaN);

    measure(() => {
      shape.parse(NaN);
    });
  });
});
