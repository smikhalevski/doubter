import { ArrayShape, ConstShape, Shape } from '../../main';
import { CODE_ARRAY_INCLUDES, CODE_ARRAY_MAX, CODE_ARRAY_MIN } from '../../main/constants';

describe('length', () => {
  test('checks length', () => {
    const shape = new ArrayShape([], new Shape()).length(2);

    expect(shape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(shape.try([111])).toEqual({ ok: false, issues: expect.any(Array) });
    expect(shape.try([111, 222, 333])).toEqual({ ok: false, issues: expect.any(Array) });
  });
});

describe('min', () => {
  test('checks min length', () => {
    const shape = new ArrayShape([], new Shape()).min(2);

    expect(shape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(shape.try([111])).toEqual({
      ok: false,
      issues: [{ code: CODE_ARRAY_MIN, input: [111], message: 'Must have the minimum length of 2', param: 2 }],
    });
  });
});

describe('max', () => {
  test('checks max length', () => {
    const shape = new ArrayShape([], new Shape()).max(2);

    expect(shape.try([111, 222])).toEqual({ ok: true, value: [111, 222] });
    expect(shape.try([111, 222, 333])).toEqual({
      ok: false,
      issues: [
        { code: CODE_ARRAY_MAX, input: [111, 222, 333], message: 'Must have the maximum length of 2', param: 2 },
      ],
    });
  });
});

describe('nonEmpty', () => {
  test('checks min length', () => {
    const shape = new ArrayShape([], new Shape()).nonEmpty();

    expect(shape.try([111])).toEqual({ ok: true, value: [111] });
    expect(shape.try([])).toEqual({
      ok: false,
      issues: [{ code: CODE_ARRAY_MIN, input: [], message: 'Must have the minimum length of 1', param: 1 }],
    });
  });
});

describe('includes', () => {
  test('checks that an array includes a literal value', () => {
    const shape = new ArrayShape([], new Shape()).includes(111);

    expect(shape.try([111])).toEqual({ ok: true, value: [111] });
    expect(shape.try([222])).toEqual({
      ok: false,
      issues: [{ code: CODE_ARRAY_INCLUDES, input: [222], message: Shape.messages[CODE_ARRAY_INCLUDES], param: 111 }],
    });
  });

  test('checks that an array includes an element that conforms the shape', () => {
    const shape = new ArrayShape([], new Shape()).includes(new ConstShape(111));

    expect(shape.isAsync).toBe(false);
    expect(shape.try([111])).toEqual({ ok: true, value: [111] });
    expect(shape.try([222])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ARRAY_INCLUDES,
          input: [222],
          message: Shape.messages[CODE_ARRAY_INCLUDES],
          param: expect.any(ConstShape),
        },
      ],
    });
  });

  test('checks that an array includes an element that conforms the async shape', async () => {
    const shape = new ArrayShape([], new Shape()).includes(new ConstShape(222).checkAsync(() => Promise.resolve()));

    expect(shape.isAsync).toBe(true);

    await expect(shape.tryAsync([111, 222, 333])).resolves.toEqual({ ok: true, value: [111, 222, 333] });
    await expect(shape.tryAsync([111, 333])).resolves.toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ARRAY_INCLUDES,
          input: [111, 333],
          message: Shape.messages[CODE_ARRAY_INCLUDES],
          param: expect.any(ConstShape),
        },
      ],
    });
  });
});
