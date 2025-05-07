import { describe, expect, test } from 'vitest';
import { SetShape, Shape } from '../../main/index.js';
import { CODE_SET_MAX, CODE_SET_MIN } from '../../main/constants.js';

describe('size', () => {
  test('checks size', () => {
    const shape = new SetShape(new Shape()).size(2);

    expect(shape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
    expect(shape.try(new Set([111]))).toEqual({ ok: false, issues: expect.any(Array) });
    expect(shape.try(new Set([111, 222, 333]))).toEqual({ ok: false, issues: expect.any(Array) });
  });
});

describe('min', () => {
  test('checks min size', () => {
    const shape = new SetShape(new Shape()).min(2);

    expect(shape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
    expect(shape.try(new Set([111]))).toEqual({
      ok: false,
      issues: [{ code: CODE_SET_MIN, input: new Set([111]), message: 'Must have the minimum size of 2', param: 2 }],
    });
  });
});

describe('max', () => {
  test('checks max size', () => {
    const shape = new SetShape(new Shape()).max(2);

    expect(shape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
    expect(shape.try(new Set([111, 222, 333]))).toEqual({
      ok: false,
      issues: [
        { code: CODE_SET_MAX, input: new Set([111, 222, 333]), message: 'Must have the maximum size of 2', param: 2 },
      ],
    });
  });
});
