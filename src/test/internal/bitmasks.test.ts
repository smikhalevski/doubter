import { getBit, toggleBit } from '../../main/internal';

describe('toggleBit', () => {
  test('sets bit', () => {
    expect(toggleBit(0b0, 5)).toBe(0b100000);
    expect(toggleBit(0b1, 5)).toBe(0b100001);
    expect(toggleBit(0b100, 5)).toBe(0b100100);
    expect(toggleBit(0, 31)).toBe(-2147483648);
    expect(toggleBit(0, 32)).toEqual([0, 1, 0]);
    expect(toggleBit(0, 35)).toEqual([0, 0b1000, 0]);
  });

  test('removes bit', () => {
    expect(toggleBit(toggleBit(0b1, 5), 5)).toBe(0b1);
  });
});

describe('getBit', () => {
  test('get the bit status', () => {
    expect(getBit(toggleBit(toggleBit(0, 1), 2), 3)).toBe(0);
    expect(getBit(toggleBit(toggleBit(0, 1), 2), 2)).toBe(1);
    expect(getBit(toggleBit(toggleBit(0, 1), 2), 1)).toBe(1);
    expect(getBit(toggleBit(toggleBit(0, 1), 2), 1)).toBe(1);

    expect(getBit(toggleBit(toggleBit(0, 91), 92), 93)).toBe(0);
    expect(getBit(toggleBit(toggleBit(0, 91), 92), 92)).toBe(1);
    expect(getBit(toggleBit(toggleBit(0, 91), 92), 91)).toBe(1);
  });

  test('edge cases', () => {
    expect(getBit(toggleBit(0b1, 31), 31)).toBe(1);
    expect(getBit(toggleBit(0b1, 32), 32)).toBe(1);

    expect(getBit(0, 2 ** 32)).toBe(0);

    expect(getBit(toggleBit(0, 2 ** 31), 2 ** 31 - 128)).toBe(0);

    expect(getBit(toggleBit(0, 2 ** 31 - 1), 2 ** 31 - 1)).toBe(1);

    expect(getBit([0], 2)).toBe(0);
    expect(getBit([0], 2 ** 31 - 1)).toBe(0);
  });
});
