import { DateShape } from '../../main';
import { CODE_DATE_MAX, CODE_DATE_MIN } from '../../main/constants';

const currDate = new Date();
const prevDate = new Date(currDate.getTime() - 1);
const nextDate = new Date(currDate.getTime() + 1);

describe('min', () => {
  test('raises if value is not greater than or equal', () => {
    expect(new DateShape().min(currDate).try(prevDate)).toEqual({
      ok: false,
      issues: [{ code: CODE_DATE_MIN, input: prevDate, param: currDate, message: 'Must be after ' + currDate }],
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
      issues: [{ code: CODE_DATE_MAX, input: nextDate, param: currDate, message: 'Must be before ' + currDate }],
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

describe('iso', () => {
  test('converts date to iso', () => {
    expect(new DateShape().toISOString().parse(currDate)).toBe(currDate.toISOString());
  });
});

describe('timestamp', () => {
  test('converts date to timestamp', () => {
    expect(new DateShape().toTimestamp().parse(currDate)).toBe(currDate.getTime());
  });
});
