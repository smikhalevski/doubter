import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.not(d.string())['$inferOutput']).toEqualTypeOf<any>();
});
