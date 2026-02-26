import { describe, measure, test } from 'toofast';
import * as doubter from '../../../lib/index.js';

describe('lazy(() => object(…))', () => {
  const value: any = {};

  value.value = value;

  test('doubter', () => {
    const shape: doubter.AnyShape = doubter.lazy(() => doubter.object({ value: shape }));

    measure(() => {
      shape.parse(value);
    });
  });
});
