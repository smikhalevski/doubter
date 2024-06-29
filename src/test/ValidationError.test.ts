import { ValidationError } from '../main';
import { inspect } from '../main/ValidationError';

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

  test('uses custom message', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});

describe('inspect', () => {
  test('stringifies symbol and bigint values to string', () => {
    expect(inspect([Symbol('aaa'), BigInt('111')])).toBe(`[
  "Symbol(aaa)",
  "111n"
]`);
  });

  test('stringifies circular references', () => {
    const aaa: any = {};
    aaa.bbb = { xxx: 111 };
    aaa.ccc = aaa.bbb;
    aaa.ddd = { yyy: aaa };
    aaa.eee = { zzz: aaa.ddd };
    aaa.fff = {};
    aaa.fff.ggg = aaa.fff;

    expect(inspect(aaa)).toBe(`{
  "bbb": {
    "xxx": 111
  },
  "ccc": {
    "xxx": 111
  },
  "ddd": {
    "yyy": "[Circular]"
  },
  "eee": {
    "zzz": {
      "yyy": "[Circular]"
    }
  },
  "fff": {
    "ggg": "[Circular]"
  }
}`);
  });

  test('stringifies functions', () => {
    expect(inspect(function () {})).toBe('"ƒ ()"');

    expect(inspect(function xxx() {})).toBe('"ƒ xxx()"');
  });
});
