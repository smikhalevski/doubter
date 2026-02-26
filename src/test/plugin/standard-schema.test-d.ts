import { StandardSchemaV1 } from '@standard-schema/spec';
import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  const shape = d.array(d.const(111).convert(() => 'aaa'));

  expectTypeOf(null! as StandardSchemaV1.InferInput<typeof shape>).toEqualTypeOf<111[]>();

  expectTypeOf(null! as StandardSchemaV1.InferOutput<typeof shape>).toEqualTypeOf<string[]>();
});
