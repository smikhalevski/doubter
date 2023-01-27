import { expectType } from 'tsd';
import * as d from 'doubter';

class FooClass {
  aaa = 111;
}

expectType<FooClass>(d.instanceOf(FooClass).output);
