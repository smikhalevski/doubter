import { NumberShape } from '../../main';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_NUMBER_TYPE,
  TYPE_NUMBER,
} from '../../main/constants';

describe('NumberShape', () => {
  test('parses a number', () => {
    expect(new NumberShape().parse(111)).toBe(111);
  });

  test('raises if value is not a number', () => {
    expect(new NumberShape().try('111')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: '111', param: TYPE_NUMBER, message: MESSAGE_NUMBER_TYPE }],
    });

    expect(new NumberShape().try(NaN)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: NaN, param: TYPE_NUMBER, message: expect.any(String) }],
    });

    expect(new NumberShape().gt(2).parse(3)).toBe(3);
  });

  test('raises if value is an infinity', () => {
    expect(new NumberShape().try(Infinity)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: Infinity, param: TYPE_NUMBER, message: MESSAGE_NUMBER_TYPE }],
    });
  });

  test('raises if value is not greater than or equal', () => {
    expect(new NumberShape().gte(2).try(1)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GTE, path: [], input: 1, param: 2, message: 'Must be greater than or equal to 2' }],
    });

    expect(new NumberShape().gte(2).parse(2)).toBe(2);
  });

  test('raises if value is not less than', () => {
    expect(new NumberShape().lt(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, path: [], input: 3, param: 2, message: 'Must be less than 2' }],
    });

    expect(new NumberShape().lt(2).try(2)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, path: [], input: 2, param: 2, message: 'Must be less than 2' }],
    });

    expect(new NumberShape().lt(2).parse(1)).toBe(1);
  });

  test('raises if value is not less than or equal', () => {
    expect(new NumberShape().lte(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LTE, path: [], input: 3, param: 2, message: 'Must be less than or equal to 2' }],
    });

    expect(new NumberShape().lte(2).parse(2)).toBe(2);
  });

  test('raises if value is not a multiple of', () => {
    expect(new NumberShape().multipleOf(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_MULTIPLE_OF, path: [], input: 3, param: 2, message: 'Must be a multiple of 2' }],
    });

    expect(new NumberShape().multipleOf(2).parse(4)).toBe(4);
  });

  test('overrides message for type issue', () => {
    expect(new NumberShape({ message: 'aaa', meta: 'bbb' }).try('ccc')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'ccc', param: TYPE_NUMBER, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('overrides message for min issue', () => {
    expect(new NumberShape().gt(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, path: [], input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
    });

    expect(new NumberShape().gte(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GTE, path: [], input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('overrides message for max issue', () => {
    expect(new NumberShape().lt(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, path: [], input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
    });

    expect(new NumberShape().lte(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LTE, path: [], input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    expect(new NumberShape().gt(2).multipleOf(3, { unsafe: true }).try(1, { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_NUMBER_GT, path: [], input: 1, param: 2, message: 'Must be greater than 2' },
        { code: CODE_NUMBER_MULTIPLE_OF, path: [], input: 1, param: 3, message: 'Must be a multiple of 3' },
      ],
    });
  });

  test('raises a single issue', () => {
    expect(new NumberShape().gt(2).multipleOf(3, { unsafe: true }).try(1)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, path: [], input: 1, param: 2, message: 'Must be greater than 2' }],
    });
  });

  test('applies checks', () => {
    expect(new NumberShape().check(() => [{ code: 'xxx' }]).try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('supports async validation', async () => {
    await expect(new NumberShape().gt(3).tryAsync(2)).resolves.toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, path: [], input: 2, param: 3, message: 'Must be greater than 3' }],
    });
  });
});
