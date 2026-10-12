import { createCharacter, type Attributes, type CharacterBuild } from './character';
import type { Point } from '../navigation';
import type { RollResult } from '../rpg';
import { square } from '../data/square';
export type GameState = {
  character: CharacterBuild;
  scene: 'Square';
  position: Point;
  flags: Record<string, boolean>;
  checks: Record<string, RollResult>;
  dialogue: { nodeId: string; result: string; revealed: number } | null;
  cardOpen: boolean;
  movement: { path: Point[]; talkPending: boolean; flipX: boolean };
};
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** Build is installed only at creation/restore. All runtime snapshots are deeply frozen. */
export class GameSession {
  private current: GameState;
  constructor(attributes: Attributes, restored?: GameState) {
    this.current = freeze(restored ? structuredClone(restored) : {
      character: createCharacter(attributes), scene: 'Square', position: { ...square.player }, flags: {}, checks: {},
      dialogue: null, cardOpen: false, movement: { path: [], talkPending: false, flipX: false }
    });
  }
  get state(): GameState { return this.current; }
  snapshot(): GameState { return structuredClone(this.current); }
  update(change: Partial<Omit<GameState, 'character' | 'scene'>>) { if (Object.hasOwn(change, 'character') || Object.hasOwn(change, 'scene')) throw new Error('Build aktywnej postaci jest niezmienny.'); this.current = freeze({ ...this.current, ...structuredClone(change) }); }
}
