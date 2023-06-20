import { StringShape } from '../../main';

describe('CoercibleShape', () => {
  test('does not coerce values of a valid type', () => {
    const cbMock = jest.fn();
    const shape = new StringShape().coerce(cbMock);

    expect(shape.parse('aaa')).toBe('aaa');
    expect(cbMock).not.toHaveBeenCalled();
  });

  test('applies coercion callback', () => {
    const shape = new StringShape().coerce(value => '__' + value);

    expect(shape.parse(111)).toBe('__111');
  });
});
