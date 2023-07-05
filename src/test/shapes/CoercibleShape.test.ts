import { StringShape } from '../../main';

describe('CoercibleShape', () => {
  test('does not coerce values of the expected type', () => {
    const cbMock = jest.fn();
    const shape = new StringShape().coerce(cbMock);

    expect(shape.parse('aaa')).toBe('aaa');
    expect(cbMock).not.toHaveBeenCalled();
  });

  test('applies the coercion callback', () => {
    const cbMock = jest.fn().mockReturnValue('aaa');
    const shape = new StringShape().coerce(cbMock);

    expect(shape.parse(111)).toBe('aaa');
    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 111);
  });
});
