import { describe, expect, test } from 'vitest';
import * as d from '../../main/index.ts';

describe('instanceOf', () => {
  test('returns an instance shape', () => {
    class TestClass {}

    expect(d.instanceOf(TestClass)).toBeInstanceOf(d.InstanceShape);
  });
});
