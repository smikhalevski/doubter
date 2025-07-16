import { describe, measure, test } from 'toofast';
import * as doubter from '../../../lib/index.js';

describe('lazy(() => object(…))', () => {
  const value = {};
  value.value = value;

  test('doubter', () => {
    const shape = doubter.lazy(() => doubter.object({ value: shape }));

    measure(() => {
      shape.parse(value);
    });
  });
});
