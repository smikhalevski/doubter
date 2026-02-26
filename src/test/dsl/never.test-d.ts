import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.never()[OUTPUT]).toEqualTypeOf<never>();
});
