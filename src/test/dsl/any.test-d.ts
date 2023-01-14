import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111>(d.any((value): value is 111 => true).output);

expectType<string | null>(d.any<string>().nullable().output);

expectType<string | 111>(d.any<string>().nullable(111).output);

expectType<string | undefined>(d.any<string>().parseOrDefault(111));

expectType<string | true>(d.any<string>().parseOrDefault(111, true));
