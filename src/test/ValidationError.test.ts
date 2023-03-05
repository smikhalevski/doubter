import { ValidationError } from '../main';
import {
  CODE_UNION,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_STRING_TYPE,
  MESSAGE_UNION,
  TYPE_NUMBER,
  TYPE_STRING,
} from '../main/constants';
import { stringifyIssues } from '../main/ValidationError';

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

describe('stringifyIssues', () => {
  test('', () => {
    expect(
      stringifyIssues([
        {
          code: CODE_UNION,
          path: [{}, 1, 'foo'],
          message: MESSAGE_UNION,
          param: {
            inputTypes: [],
            issueGroups: [
              [
                { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
                { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
                { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
                {
                  code: CODE_UNION,
                  path: [{}, 1, 'foo'],
                  message: MESSAGE_UNION,
                  param: {
                    inputTypes: [],
                    issueGroups: [
                      [{ code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE }],
                      [{ code: TYPE_NUMBER, path: ['bbb'], message: MESSAGE_NUMBER_TYPE }],
                    ],
                  },
                },
              ],
              [{ code: TYPE_NUMBER, path: ['bbb'], message: MESSAGE_NUMBER_TYPE }],
            ],
          },
        },
      ]).toString()
    ).toBe(`/{⋯}/1/foo: Must conform the union

  1)  /aaa: Must be a string
      /aaa: Must be a string
      /aaa: Must be a string

      /{⋯}/1/foo: Must conform the union

        1)  /aaa: Must be a string

        2)  /bbb: Must be a number

  2)  /bbb: Must be a number`);
  });
});
