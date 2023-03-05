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

    expect(error.toString()).toBe('ValidationError: \naaa at /\nunknown at /: bbb');
  });

  test('custom message can be assigned', () => {
    const error = new ValidationError([{}]);

    error.message = 'aaa';

    expect(error.message).toBe('aaa');

    error.message = 'bbb';

    expect(error.message).toBe('bbb');
  });
});

// describe('stringifyIssues', () => {
//   test('', () => {
//     expect(
//       stringifyIssues([
//         {
//           code: CODE_UNION,
//           path: [{}, 1, 'foo'],
//           message: MESSAGE_UNION,
//           param: {
//             inputTypes: [],
//             issueGroups: [
//               [
//                 { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
//                 { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
//                 { code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE },
//                 {
//                   code: CODE_UNION,
//                   path: [{}, 1, 'foo'],
//                   message: MESSAGE_UNION,
//                   param: {
//                     inputTypes: [],
//                     issueGroups: [
//                       [{ code: TYPE_STRING, path: ['aaa'], message: MESSAGE_STRING_TYPE }],
//                       [{ code: TYPE_NUMBER, path: ['bbb'], message: MESSAGE_NUMBER_TYPE }],
//                     ],
//                   },
//                 },
//               ],
//               [{ code: TYPE_NUMBER, path: ['bbb'], message: MESSAGE_NUMBER_TYPE }],
//             ],
//           },
//         },
//       ]).toString()
//     ).toBe('');
//   });
// });
