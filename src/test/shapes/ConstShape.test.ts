import { ConstShape } from '../../main';
import { CODE_CONST } from '../../main/constants';

describe('ConstShape', () => {
  test('parses exact value', () => {
    const shape = new ConstShape('aaa');

    expect(shape.value).toBe('aaa');
    expect(shape.parse('aaa'));
  });

  test('supports NaN', () => {
    expect(new ConstShape(NaN).parse(NaN)).toBe(NaN);
  });

  test('raises an issue if input does not equal to value', () => {
    expect(new ConstShape('aaa').try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_CONST, input: 'bbb', message: 'Must be equal to aaa', param: 'aaa' }],
    });
  });

  test('applies checks', () => {
    const shape = new ConstShape('aaa').check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('returns input types of the value', () => {
    expect(new ConstShape('aaa').inputs).toEqual(['aaa']);
  });
});
