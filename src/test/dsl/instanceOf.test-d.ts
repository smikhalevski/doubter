import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass)[OUTPUT]);
