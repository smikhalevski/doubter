import { ArrayShape, NumberShape, StringShape } from '../../main';

describe('StringShape', () => {
  test('validates string', () => {
    const type = new ArrayShape(new NumberShape().gte(0)).length(3);
    type.parse([1, 2, 3]);
  });
});
