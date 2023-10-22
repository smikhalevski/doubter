import { StringShape } from '../main';
import { TYPE_STRING } from '../main/Type';

test('overrides global message', () => {
  StringShape.messages['type.string'] = (issue, options) => 111;

  expect(new StringShape().try(222)).toEqual({
    ok: false,
    issues: [
      {
        code: 'type',
        input: 222,
        message: 111,
        param: TYPE_STRING,
      },
    ],
  });
});
