import { ValidationError } from '../main';

describe('ValidationError', () => {
  test('creates message from issues', () => {
    const error = new ValidationError([{ code: 'aaa' }, { message: 'bbb' }]);

    expect(error.toString()).toBe('ValidationError: [{ code: "aaa" }, { message: "bbb" }]');
  });

  test('uses custom message', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});
