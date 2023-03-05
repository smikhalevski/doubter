import {
  CODE_UNION,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_STRING_TYPE,
  MESSAGE_UNION,
  TYPE_NUMBER,
  TYPE_STRING,
} from '../../main/constants';
import { stringifyIssues } from '../../main/utils/errors';

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
