import * as d from 'doubter';
import { expectType } from 'tsd';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass).__output);
