import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(d.promise().parse(Promise.resolve('aaa'))).toEqualTypeOf<Promise<any>>();

  expectTypeOf(d.promise(d.string()).parseAsync(Promise.resolve('aaa'))).toEqualTypeOf<Promise<string>>();
});
