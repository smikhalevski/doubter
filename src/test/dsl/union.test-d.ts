import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.or([d.string(), d.number(), d.boolean()])['$inferOutput']).toEqualTypeOf<string | number | boolean>();

  expectTypeOf(d.or([d.string(), d.never()])['$inferOutput']).toEqualTypeOf<string>();

  expectTypeOf(d.or([d.string(), d.any()])['$inferOutput']).toEqualTypeOf<any>();

  expectTypeOf(d.or([d.string(), d.unknown()])['$inferOutput']).toEqualTypeOf<unknown>();
});
