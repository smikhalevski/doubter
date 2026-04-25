import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.date().toISOString()['$inferInput']).toEqualTypeOf<Date>();

  expectTypeOf(d.date().toISOString()['$inferOutput']).toEqualTypeOf<string>();
});
