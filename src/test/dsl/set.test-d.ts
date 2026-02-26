import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.set(d.or([d.string(), d.number()]))[OUTPUT]).toEqualTypeOf<Set<string | number>>();

  expectTypeOf(d.set(d.const(111))[OUTPUT]).toEqualTypeOf<Set<111>>();

  expectTypeOf(d.set(d.string()).readonly()[INPUT]).toEqualTypeOf<Set<string>>();

  expectTypeOf(d.set(d.string()).readonly()[OUTPUT]).not.toExtend<Set<string>>();

  expectTypeOf(d.set(d.string()).readonly()[OUTPUT]).toEqualTypeOf<ReadonlySet<string>>();
});
