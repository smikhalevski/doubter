import { BigIntShape } from '../../main';
import { CODE_BIGINT_MAX, CODE_BIGINT_MIN } from '../../main/constants';

describe('min', () => {
  test('raises if value is not greater than or equal', () => {
    expect(new BigIntShape().min(2).try(BigInt(1))).toEqual({
      ok: false,
      issues: [
        { code: CODE_BIGINT_MIN, input: BigInt(1), param: BigInt(2), message: 'Must be greater than or equal to 2n' },
      ],
    });

    expect(new BigIntShape().min(2).parse(BigInt(2))).toBe(BigInt(2));
  });

  test('overrides message', () => {
    expect(new BigIntShape().min(2, { message: 'xxx', meta: 'yyy' }).try(BigInt(0))).toEqual({
      ok: false,
      issues: [{ code: CODE_BIGINT_MIN, input: BigInt(0), param: BigInt(2), message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('max', () => {
  test('raises if value is not less than or equal', () => {
    expect(new BigIntShape().max(2).try(BigInt(3))).toEqual({
      ok: false,
      issues: [
        { code: CODE_BIGINT_MAX, input: BigInt(3), param: BigInt(2), message: 'Must be less than or equal to 2n' },
      ],
    });

    expect(new BigIntShape().max(2).try(BigInt(3))).toEqual({
      ok: false,
      issues: [
        { code: CODE_BIGINT_MAX, input: BigInt(3), param: BigInt(2), message: 'Must be less than or equal to 2n' },
      ],
    });

    expect(new BigIntShape().max(2).parse(BigInt(2))).toBe(BigInt(2));
  });

  test('overrides message', () => {
    expect(new BigIntShape().max(2, { message: 'xxx', meta: 'yyy' }).try(BigInt(3))).toEqual({
      ok: false,
      issues: [{ code: CODE_BIGINT_MAX, input: BigInt(3), param: BigInt(2), message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('positive/nonNegative', () => {
  test('raises if value is not positive', () => {
    expect(new BigIntShape().positive().try(BigInt(-111)).ok).toBe(false);
    expect(new BigIntShape().nonNegative().try(BigInt(-111)).ok).toBe(false);

    expect(new BigIntShape().positive().try(BigInt(222)).ok).toBe(true);
    expect(new BigIntShape().nonNegative().try(BigInt(222)).ok).toBe(true);
  });
});

describe('negative/nonPositive', () => {
  test('raises if value is not negative', () => {
    expect(new BigIntShape().negative().try(BigInt(111)).ok).toBe(false);
    expect(new BigIntShape().nonPositive().try(BigInt(111)).ok).toBe(false);

    expect(new BigIntShape().negative().try(BigInt(-222)).ok).toBe(true);
    expect(new BigIntShape().nonPositive().try(BigInt(-222)).ok).toBe(true);
  });
});
