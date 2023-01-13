import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111>(d.any((value): value is 111 => true).parse(null));

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));
