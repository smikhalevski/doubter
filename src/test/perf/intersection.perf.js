import { describe, measure, test } from 'toofast';
import * as myzod from 'myzod';
import * as zod from 'zod';
import * as doubter from '../../../lib/index.mjs';

describe('and([object({ foo: string() }), object({ bar: number() })])', () => {
  const value = { foo: 'aaa', bar: 123 };

  test('zod', () => {
    const type = zod.intersection(
      zod.object({ foo: zod.string() }).passthrough(),
      zod.object({ bar: zod.number() }).passthrough()
    );

    measure(() => {
      type.parse(value);
    });
  });

  test('myzod', () => {
    const type = myzod.intersection(
      myzod.object({ foo: myzod.string() }, { allowUnknown: true }),
      myzod.object({ bar: myzod.number() }, { allowUnknown: true })
    );

    measure(() => {
      type.parse(value);
    });
  });

  test('doubter', () => {
    const shape = doubter.and([doubter.object({ foo: doubter.string() }), doubter.object({ bar: doubter.number() })]);

    measure(() => {
      shape.parse(value);
    });
  });
});
