import * as d from 'doubter';
import { expectType } from 'tsd';

class FooClass {
  aaa = 111;
}

expectType<FooClass>(d.instanceOf(FooClass).output);
