import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.tuple([d.string(), d.number()])[OUTPUT]).toEqualTypeOf<[string, number]>();

  expectTypeOf(d.tuple([d.string(), d.number()])[OUTPUT]).not.toEqualTypeOf<[string, number, ...unknown[]]>();

  expectTypeOf(d.tuple([d.string(), d.number()]).headShapes[1][OUTPUT]).toEqualTypeOf<number>();

  expectTypeOf(d.tuple([d.string(), d.number()], d.boolean())[OUTPUT]).toEqualTypeOf<[string, number, ...boolean[]]>();
});
