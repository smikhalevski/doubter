import { ValidationError } from '../main';

describe('ValidationError', () => {
  test('instance of Error', () => {
    expect(new ValidationError([])).toBeInstanceOf(Error);
    expect(new ValidationError([])).toBeInstanceOf(ValidationError);
  });

  test('populates code and path', () => {
    const issue = {};
    const issues = new ValidationError([issue]).issues;

    expect(issues).toEqual([{}]);
    expect(issues[0]).toBe(issue);
  });

  test('returns message', () => {
    const error = new ValidationError([{ code: 'aaa' }, { message: 'bbb' }]);

    expect(error.toString()).toBe('ValidationError: /: aaa\n/: bbb');
  });

  test('custom message can be assigned', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});
