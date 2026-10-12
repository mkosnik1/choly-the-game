import { createCharacter, type Attributes, type CharacterBuild } from './character';
import type { Point } from '../navigation';
import type { RollResult } from '../rpg';
import { story } from '../content/story';
import { square } from '../data/square';
export type GameState = {
  character: CharacterBuild;
  scene: 'Arrival' | 'Square';
  story: { nodeId: string; visited: string[]; journal: string[]; lastTone: 'distant' | 'neutral' | null; result: string };
  journalOpen: boolean;
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
      character: createCharacter(attributes), scene: 'Arrival', story: { nodeId: story.start, visited: [story.start], journal: [], lastTone: null, result: '' }, journalOpen: false, position: { ...square.player }, flags: {}, checks: {},
      dialogue: { nodeId: story.start, result: '', revealed: 0 }, cardOpen: false, movement: { path: [], talkPending: false, flipX: false }
    });
  }
  get state(): GameState { return this.current; }
  enterSquare() { this.current = freeze({ ...this.current, scene: 'Square', position: { ...square.player }, movement: { path: [], talkPending: false, flipX: false } }); }
  snapshot(): GameState { return structuredClone(this.current); }
  update(change: Partial<Omit<GameState, 'character' | 'scene'>>) { if (Object.hasOwn(change, 'character') || Object.hasOwn(change, 'scene')) throw new Error('Build aktywnej postaci jest niezmienny.'); this.current = freeze({ ...this.current, ...structuredClone(change) }); }
}
