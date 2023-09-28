import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal/shapes';

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass)[OUTPUT]);
