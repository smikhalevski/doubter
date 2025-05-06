import { describe, expect, test } from 'vitest';
import * as d from '../../main';

describe('promise', () => {
  test('returns an unconstrained Promise shape', () => {
    const shape = d.promise();

    expect(shape).toBeInstanceOf(d.PromiseShape);
    expect(shape.valueShape).toBeNull();
  });

  test('returns a Promise shape with constrained returned value', () => {
    const valueShape = d.string();
    const shape = d.promise(valueShape);

    expect(shape).toBeInstanceOf(d.PromiseShape);
    expect(shape.valueShape).toBe(valueShape);
  });
});
