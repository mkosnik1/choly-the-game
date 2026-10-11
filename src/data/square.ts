/** Scene 002 only. Positions refer to feet/base, in the 960×540 world. */
export type Footprint = { x: number; y: number; width: number; height: number };
export type Prop = {
  id: string;
  texture: 'shop' | 'house' | 'van' | 'chestnut';
  x: number;
  y: number;
  footprint: Footprint;
  scale: number;
};
export const square = {
  width: 960,
  height: 540,
  bounds: { left: 20, right: 940, top: 52, bottom: 478 },
  player: { x: 470, y: 365 },
  piotr: { x: 690, y: 310, approach: { x: 650, y: 330 } },
  props: [
    { id: 'shop', texture: 'shop', x: 200, y: 202, scale: 2, footprint: { x: 60, y: 70, width: 280, height: 132 } },
    { id: 'houses', texture: 'house', x: 766, y: 212, scale: 2, footprint: { x: 630, y: 60, width: 265, height: 152 } },
    { id: 'cottage', texture: 'house', x: 490, y: 135, scale: 1, footprint: { x: 420, y: 80, width: 138, height: 55 } },
    { id: 'zuk', texture: 'van', x: 186, y: 375, scale: 2, footprint: { x: 122, y: 324, width: 128, height: 51 } },
    { id: 'chestnut', texture: 'chestnut', x: 850, y: 365, scale: 2, footprint: { x: 840, y: 354, width: 20, height: 16 } }
  ] satisfies Prop[],
  // Ambient villagers have no story branches or new quest state.
  villagers: [
    { x: 355, y: 249, coat: 'ochre' },
    { x: 590, y: 218, coat: 'green' },
    { x: 747, y: 449, coat: 'burgundy' }
  ] as const
};
