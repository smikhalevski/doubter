import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

class TestClass {
  aaa = 111;
}

test('expected types', () => {
  expectTypeOf(d.instanceOf(TestClass)['$inferOutput']).toEqualTypeOf<TestClass>();
});
