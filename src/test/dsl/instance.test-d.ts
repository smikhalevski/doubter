import * as d from 'doubter';
import { expectType } from 'tsd';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instance(TestClass)[d.OUTPUT]);
