import { describe, it, expect } from 'vitest';
import { findPath, canWalk } from '../src/navigation';
import { square } from '../src/data/square';

describe('scene 002 prop footprints', () => {
  it.each([
    ['Żuk', { x: 90, y: 350 }, { x: 300, y: 350 }],
    ['kasztanowiec', { x: 805, y: 365 }, { x: 900, y: 365 }]
  ] as const)('routes around %s instead of walking through it', (_, start, end) => {
    expect(canWalk(start, end)).toBe(false);
    const path = findPath(start, end);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual(end);
    let previous = start;
    for (const point of path) { expect(canWalk(previous, point)).toBe(true); previous = point; }
  });
  it('keeps Piotr and the square reachable after adding scenery', () => {
    for (const destination of [square.piotr.approach, { x: 30, y: 120 }, { x: 500, y: 400 }]) {
      const path = findPath(square.player, destination);
      expect(path.at(-1)).toEqual(destination);
    }
    for (const prop of square.props) {
      const r = prop.footprint;
      expect(findPath(square.player, { x: r.x + r.width / 2, y: r.y + r.height / 2 })).toEqual([]);
    }
  });
});
