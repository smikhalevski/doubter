import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.date().toISOString()[INPUT]).toEqualTypeOf<Date>();

  expectTypeOf(d.date().toISOString()[OUTPUT]).toEqualTypeOf<string>();
});
