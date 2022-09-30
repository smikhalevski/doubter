import { ValidationError } from '../main';

describe('ValidationError', () => {
  test('instance of Error', () => {
    expect(new ValidationError([])).toBeInstanceOf(Error);
  });

  test('populates code and path', () => {
    const issue = {};
    const issues = new ValidationError([issue]).issues;

    expect(issues).toEqual([
      {
        code: 'unknown',
        path: [],
      },
    ]);
    expect(issues[0]).toBe(issue);
  });

  test('returns message', () => {
    expect(new ValidationError([{ code: 'aaa' }, { message: 'bbb' }]).toString()).toBe(
      'ValidationError: \naaa at /\nunknown at /: bbb'
    );
  });

  test('custom message can be assigned', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});
