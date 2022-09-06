import { StringShape } from '../../main';

describe('StringShape', () => {
  test('validates string', () => {
    const type = new StringShape().max(3);
    type.parse('qweqwe');
  });
});
