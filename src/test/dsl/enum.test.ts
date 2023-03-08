import * as d from '../../main';
import { TYPE_NEVER } from '../../main/constants';

describe('enum', () => {
  test('returns an enum shape', () => {
    const shape = d.enum([111, 222]);

    expect(shape).toBeInstanceOf(d.EnumShape);
    expect(shape.inputValues).toEqual([111, 222]);
  });

  test('enums with no common values produce never when intersected', () => {
    expect(d.and([d.enum([111, 222]), d.enum([333])]).inputTypes).toEqual([TYPE_NEVER]);
  });
});
