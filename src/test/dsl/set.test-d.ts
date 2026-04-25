import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.set(d.or([d.string(), d.number()]))['$inferOutput']).toEqualTypeOf<Set<string | number>>();

  expectTypeOf(d.set(d.const(111))['$inferOutput']).toEqualTypeOf<Set<111>>();

  expectTypeOf(d.set(d.string()).readonly()['$inferInput']).toEqualTypeOf<Set<string>>();

  expectTypeOf(d.set(d.string()).readonly()['$inferOutput']).not.toExtend<Set<string>>();

  expectTypeOf(d.set(d.string()).readonly()['$inferOutput']).toEqualTypeOf<ReadonlySet<string>>();
});
