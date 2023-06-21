import { ArrayShape, Shape } from '../../main';
import { CODE_ARRAY_MAX, CODE_ARRAY_MIN } from '../../main/constants';

describe('length', () => {
  test('checks length', () => {
    const arrShape = new ArrayShape([], new Shape()).length(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111])).toEqual({ ok: false, issues: expect.any(Array) });
    expect(arrShape.try([111, 222, 333])).toEqual({ ok: false, issues: expect.any(Array) });
  });
});

describe('min', () => {
  test('checks min length', () => {
    const arrShape = new ArrayShape([], new Shape()).min(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111])).toEqual({
      ok: false,
      issues: [{ code: CODE_ARRAY_MIN, input: [111], message: 'Must have the minimum length of 2', param: 2 }],
    });
  });
});

describe('max', () => {
  test('checks max length', () => {
    const arrShape = new ArrayShape([], new Shape()).max(2);

    expect(arrShape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(arrShape.try([111, 222, 333])).toEqual({
      ok: false,
      issues: [
        { code: CODE_ARRAY_MAX, input: [111, 222, 333], message: 'Must have the maximum length of 2', param: 2 },
      ],
    });
  });
});
