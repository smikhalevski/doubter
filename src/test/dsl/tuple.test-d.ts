import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.tuple([d.string(), d.number()])['$inferOutput']).toEqualTypeOf<[string, number]>();

  expectTypeOf(d.tuple([d.string(), d.number()])['$inferOutput']).not.toEqualTypeOf<[string, number, ...unknown[]]>();

  expectTypeOf(d.tuple([d.string(), d.number()]).headShapes[1]['$inferOutput']).toEqualTypeOf<number>();

  expectTypeOf(d.tuple([d.string(), d.number()], d.boolean())['$inferOutput']).toEqualTypeOf<
    [string, number, ...boolean[]]
  >();
});
