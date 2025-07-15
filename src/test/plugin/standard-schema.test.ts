import { expect, test } from 'vitest';
import { CODE_STRING_MIN } from '../../main/constants.js';
import { PromiseShape, StringShape } from '../../main/index.js';
import '../../main/plugin/standard-schema.js';

test('synchronously validates using a standard schema API', () => {
  expect(new StringShape().min(2)['~standard'].validate('a')).toEqual({
    ok: false,
    issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'Must have the minimum length of 2' }],
  });
});

test('asynchronously validates using a standard schema API', async () => {
  const promise = new PromiseShape(new StringShape().min(2))['~standard'].validate(Promise.resolve('a'));

  expect(promise).toBeInstanceOf(Promise);

  await expect(promise).resolves.toEqual({
    ok: false,
    issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'Must have the minimum length of 2' }],
  });
});
