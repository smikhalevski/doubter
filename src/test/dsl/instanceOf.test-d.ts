import { expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

class TestClass {
  aaa = 111;
}

expectType<TestClass>(d.instanceOf(TestClass)[OUTPUT]);
