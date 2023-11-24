import { StringShape } from '../main';
import { Type } from '../main/Type';

test('overrides global message', () => {
  StringShape.messages['type.string'] = (issue, options) => 111;

  expect(new StringShape().try(222)).toEqual({
    ok: false,
    issues: [
      {
        code: 'type',
        input: 222,
        message: 111,
        param: Type.STRING,
      },
    ],
  });
});
