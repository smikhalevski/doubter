import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(d.or([d.string(), d.number(), d.boolean()])[OUTPUT]).toEqualTypeOf<string | number | boolean>();

  expectTypeOf(d.or([d.string(), d.never()])[OUTPUT]).toEqualTypeOf<string>();

  expectTypeOf(d.or([d.string(), d.any()])[OUTPUT]).toEqualTypeOf<any>();

  expectTypeOf(d.or([d.string(), d.unknown()])[OUTPUT]).toEqualTypeOf<unknown>();
});
