import { square } from './data/square';
export type Point = { x: number; y: number };
export type Obstacle = { x: number; y: number; width: number; height: number };
export const buildings: Obstacle[] = square.props.filter(p => p.texture === 'shop' || p.texture === 'house').map(p => p.footprint);
const margin = 18;
const inside = (p: Point, r: Obstacle) => p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height;
export const collisionRects = square.props.map(p => ({ x: p.footprint.x - margin, y: p.footprint.y - margin, width: p.footprint.width + margin * 2, height: p.footprint.height + margin * 2 }));
export function canWalk(a: Point, b: Point): boolean {
  return collisionRects.every(r => {
    let lo = 0, hi = 1;
    for (const axis of ['x', 'y'] as const) {
      const min = r[axis], max = min + (axis === 'x' ? r.width : r.height), d = b[axis] - a[axis];
      if (d === 0) { if (a[axis] <= min || a[axis] >= max) return true; }
      else { const t1 = (min - a[axis]) / d, t2 = (max - a[axis]) / d; lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2)); }
    }
    return lo >= hi;
  });
}
export function findPath(start: Point, requested: Point): Point[] {
  const end = { x: Math.max(square.bounds.left, Math.min(square.bounds.right, requested.x)), y: Math.max(square.bounds.top, Math.min(square.bounds.bottom, requested.y)) };
  if (collisionRects.some(r => inside(end, r))) return [];
  const nodes = [start, end, ...collisionRects.flatMap(r => [
    { x: r.x, y: r.y }, { x: r.x + r.width, y: r.y },
    { x: r.x, y: r.y + r.height }, { x: r.x + r.width, y: r.y + r.height }
  ])];
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    nodes.forEach((_, i) => { if (!visited.has(i) && (current === -1 || costs[i] < costs[current])) current = i; });
    if (current === -1 || !Number.isFinite(costs[current])) return [];
    if (current === 1) { const path: Point[] = []; for (let i = 1; i !== 0; i = previous[i]) path.unshift(nodes[i]); return path; }
    visited.add(current);
    nodes.forEach((node, i) => {
      if (visited.has(i) || !canWalk(nodes[current], node)) return;
      const cost = costs[current] + Math.hypot(node.x - nodes[current].x, node.y - nodes[current].y);
      if (cost < costs[i]) { costs[i] = cost; previous[i] = current; }
    });
  }
  return [];
}
