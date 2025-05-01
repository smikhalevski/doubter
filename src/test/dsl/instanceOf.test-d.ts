import { expectType } from 'tsd';
import * as d from '../../main';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass)[OUTPUT]);
