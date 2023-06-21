import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectType } from 'tsd';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass)[OUTPUT]);
