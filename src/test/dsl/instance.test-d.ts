import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instance(TestClass)[_OUTPUT]);
