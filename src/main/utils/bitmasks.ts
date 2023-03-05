/**
 * A bitmask that can hold up to 2^31 - 1 number of bits.
 */
export type Bitmask = number[] | number;

/**
 * Toggles the bit in the bitmask at given position.
 *
 * @param bitmask The mutable mask to update.
 * @param position The index at which the bit must be toggled.
 * @returns The updated mask.
 */
export function toggleBit(bitmask: Bitmask, position: number): Bitmask {
  if (typeof bitmask === 'number') {
    if (position < 32) {
      return bitmask ^ (1 << position);
    }
    bitmask = [bitmask, 0, 0];
  }

  const bucketIndex = position >>> 5;

  bitmask[bucketIndex] ^= 1 << (position - (bucketIndex << 5));

  return bitmask;
}

/**
 * Returns the bit value at given position.
 */
export function getBit(bitmask: Bitmask, position: number): number {
  if (typeof bitmask === 'number') {
    return (bitmask >>> position) & 0b1;
  }

  const bucketIndex = position >>> 5;

  return (bitmask[bucketIndex] >>> (position - (bucketIndex << 5))) & 0b1;
}
