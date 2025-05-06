import { describe, expect, test } from 'vitest';
import { DateShape } from '../../main';
import { CODE_DATE_MAX, CODE_DATE_MIN } from '../../main/constants';

const currDate = new Date(Date.UTC(2024, 8, 2, 16, 15, 53, 299));
const prevDate = new Date(currDate.getTime() - 1);
const nextDate = new Date(currDate.getTime() + 1);

describe('min', () => {
  test('raises if value is not greater than or equal', () => {
    expect(new DateShape().min(currDate).try(prevDate)).toEqual({
      ok: false,
      issues: [
        { code: CODE_DATE_MIN, input: prevDate, param: currDate, message: 'Must be after 2024-09-02T16:15:53.299Z' },
      ],
    });

    expect(new DateShape().min(currDate).parse(currDate)).toBe(currDate);
    expect(new DateShape().min(currDate).parse(nextDate)).toBe(nextDate);
  });

  test('overrides message', () => {
    expect(new DateShape().min(currDate, { message: 'xxx', meta: 'yyy' }).try(prevDate)).toEqual({
      ok: false,
      issues: [{ code: CODE_DATE_MIN, input: prevDate, param: currDate, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('max', () => {
  test('raises if value is not greater than or equal', () => {
    expect(new DateShape().max(currDate).try(nextDate)).toEqual({
      ok: false,
      issues: [
        { code: CODE_DATE_MAX, input: nextDate, param: currDate, message: 'Must be before 2024-09-02T16:15:53.299Z' },
      ],
    });

    expect(new DateShape().max(currDate).parse(currDate)).toBe(currDate);
    expect(new DateShape().max(currDate).parse(prevDate)).toBe(prevDate);
  });

  test('overrides message', () => {
    expect(new DateShape().max(currDate, { message: 'xxx', meta: 'yyy' }).try(nextDate)).toEqual({
      ok: false,
      issues: [{ code: CODE_DATE_MAX, input: nextDate, param: currDate, message: 'xxx', meta: 'yyy' }],
    });
  });
});

describe('toISOString', () => {
  test('converts date to ISO string', () => {
    expect(new DateShape().toISOString().parse(currDate)).toBe(currDate.toISOString());
  });
});

describe('toTimestamp', () => {
  test('converts date to timestamp', () => {
    expect(new DateShape().toTimestamp().parse(currDate)).toBe(currDate.getTime());
  });
});
