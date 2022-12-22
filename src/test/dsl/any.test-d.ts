import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111>(d.any((value): value is 111 => true).parse(null));
