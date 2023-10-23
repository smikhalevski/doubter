import { ConstShape } from '../../main';
import { CODE_TYPE_CONST } from '../../main/constants';

describe('ConstShape', () => {
  test('parses exact value', () => {
    const shape = new ConstShape('aaa');

    expect(shape.value).toBe('aaa');
    expect(shape.parse('aaa'));
    expect(shape.inputs).toEqual(['aaa']);
  });

  test('supports NaN', () => {
    expect(new ConstShape(NaN).parse(NaN)).toBe(NaN);
  });

  test('raises an issue if an input does not equal to the value', () => {
    expect(new ConstShape('aaa').try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE_CONST, input: 'bbb', message: 'Must be equal to aaa', param: 'aaa' }],
    });
  });

  test('applies operations', () => {
    const shape = new ConstShape('aaa').check(() => [{ code: 'xxx' }]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('coerce', () => {
    test('coerces an input', () => {
      expect(new ConstShape('111').coerce().parse(111)).toBe('111');
      expect(new ConstShape('111').coerce().parse(new Number(111))).toBe('111');
      expect(new ConstShape('111').coerce().parse([new Number(111)])).toBe('111');
      expect(new ConstShape(1).coerce().parse(true)).toBe(1);
      expect(new ConstShape(1).parse(true, { coerce: true })).toBe(1);
    });

    test('raises an issue if coercion fails', () => {
      expect(new ConstShape(111).coerce().try('aaa')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE_CONST, input: 'aaa', message: 'Must be equal to 111', param: 111 }],
      });
    });
  });
});
