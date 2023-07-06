import { NumberShape } from '../../main';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE,
} from '../../main/constants';

describe('gt', () => {
  test('raises if value is not greater than', () => {
    expect(new NumberShape().gt(2).try(2)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 2, param: 2, message: 'Must be greater than 2' }],
    });

    expect(new NumberShape().gt(2).parse(3)).toBe(3);
  });

  test('overrides message', () => {
    expect(new NumberShape().gt(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('gte/min', () => {
  test('raises if value is not greater than or equal', () => {
    expect(new NumberShape().gte(2).try(1)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GTE, input: 1, param: 2, message: 'Must be greater than or equal to 2' }],
    });

    expect(new NumberShape().min(2).try(1)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GTE, input: 1, param: 2, message: 'Must be greater than or equal to 2' }],
    });

    expect(new NumberShape().gte(2).parse(2)).toBe(2);
  });

  test('overrides message', () => {
    expect(new NumberShape().gte(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GTE, input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('lt', () => {
  test('raises if value is not less than', () => {
    expect(new NumberShape().lt(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, input: 3, param: 2, message: 'Must be less than 2' }],
    });

    expect(new NumberShape().lt(2).try(2)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, input: 2, param: 2, message: 'Must be less than 2' }],
    });

    expect(new NumberShape().lt(2).parse(1)).toBe(1);
  });

  test('overrides message', () => {
    expect(new NumberShape().lt(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LT, input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('lte/max', () => {
  test('raises if value is not less than or equal', () => {
    expect(new NumberShape().lte(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'Must be less than or equal to 2' }],
    });

    expect(new NumberShape().max(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'Must be less than or equal to 2' }],
    });

    expect(new NumberShape().lte(2).parse(2)).toBe(2);
  });

  test('overrides message', () => {
    expect(new NumberShape().lte(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('multiple', () => {
  test('raises if value is not a multiple of a divisor', () => {
    expect(new NumberShape().multiple(2).try(3)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_MULTIPLE, input: 3, param: 2, message: 'Must be a multiple of 2' }],
    });

    expect(new NumberShape().multiple(2).parse(4)).toBe(4);
  });
});

describe('positive/nonNegative', () => {
  test('raises if value is not positive', () => {
    expect(new NumberShape().positive().try(-111).ok).toBe(false);
    expect(new NumberShape().nonNegative().try(-111).ok).toBe(false);

    expect(new NumberShape().positive().try(222).ok).toBe(true);
    expect(new NumberShape().nonNegative().try(222).ok).toBe(true);
  });
});

describe('negative/nonPositive', () => {
  test('raises if value is not negative', () => {
    expect(new NumberShape().negative().try(111).ok).toBe(false);
    expect(new NumberShape().nonPositive().try(111).ok).toBe(false);

    expect(new NumberShape().negative().try(-222).ok).toBe(true);
    expect(new NumberShape().nonPositive().try(-222).ok).toBe(true);
  });
});
