import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instance(TestClass)[OUTPUT]);