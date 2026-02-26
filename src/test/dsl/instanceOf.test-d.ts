import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

class TestClass {
  aaa = 111;
}

test('expected types', () => {
  expectTypeOf(d.instanceOf(TestClass)[OUTPUT]).toEqualTypeOf<TestClass>();
});
