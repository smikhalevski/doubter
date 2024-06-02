import { ValidationError } from '../main';

describe('ValidationError', () => {
  test('creates message from issues', () => {
    const error = new ValidationError([{ code: 'aaa' }, { message: 'bbb' }]);

    expect(error.toString()).toBe(`ValidationError: [
  {
    "code": "aaa"
  },
  {
    "message": "bbb"
  }
]`);
  });

  test('converts symbol and bigint values to string', () => {
    const error = new ValidationError([{ code: Symbol('aaa') }, { message: BigInt('111') }]);

    expect(error.toString()).toBe(`ValidationError: [
  {
    "code": "Symbol(aaa)"
  },
  {
    "message": "111"
  }
]`);
  });

  test('uses custom message', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});
