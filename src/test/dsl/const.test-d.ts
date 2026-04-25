import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.const(111)['$inferOutput']).toEqualTypeOf<111>();
});
