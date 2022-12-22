import { expectType } from 'tsd';
import * as d from '../../main';

class FooClass {
  aaa = 111;
}

expectType<FooClass>(d.instanceOf(FooClass).parse(null));
