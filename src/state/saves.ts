import { isRecord, validAttributes, validSkills, type CharacterBuild } from './character';
import { bonus, type RollResult } from '../rpg';
import { dialogues } from '../dialogues';
import { formatRoll } from '../systems/dialogue';
import { square } from '../data/square';
import { canWalk, findPath, type Point } from '../navigation';
import type { GameState } from './session';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export const browserStorage: StorageLike = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
export const SAVE_VERSION = 2;
export type Save = { version: 2; savedAt: string; state: GameState };
export type Slot = { index: number } & ({ status: 'empty' } | { status: 'valid'; save: Save } | { status: 'error'; message: string });
const boundedPoint = (v: unknown): v is Point => isRecord(v) && typeof v.x === 'number' && typeof v.y === 'number' && Number.isFinite(v.x) && Number.isFinite(v.y) && v.x >= square.bounds.left && v.x <= square.bounds.right && v.y >= square.bounds.top && v.y <= square.bounds.bottom && findPath(v as Point, v as Point).length > 0;
function validRoll(value: unknown, build: CharacterBuild): value is RollResult {
  if (!isRecord(value) || !Array.isArray(value.dice) || value.dice.length !== 2 || !value.dice.every(n => Number.isInteger(n) && n >= 1 && n <= 6) || typeof value.skill !== 'string' || !(value.skill in build.skills) || !Number.isInteger(value.dc) || !Number.isInteger(value.modifiers)) return false;
  const r = value as unknown as RollResult;
  const premia = bonus(r.skill, r.modifiers, build), total = r.dice[0] + r.dice[1] + premia;
  return r.bonus === premia && r.total === total && r.success === (total >= r.dc) && r.exceptional === (total >= r.dc + 5);
}
export function validateState(value: unknown): value is GameState {
  if (!isRecord(value) || !isRecord(value.character) || value.character.name !== 'Jerzy Drozd' || !validAttributes(value.character.attributes) || !validSkills(value.character.skills) || value.scene !== 'Square' || !boundedPoint(value.position)) return false;
  if (!isRecord(value.flags) || Object.keys(value.flags).length > 128 || !Object.entries(value.flags).every(([k, v]) => /^[a-zA-Z][\w-]{0,63}$/.test(k) && typeof v === 'boolean')) return false;
  if (!isRecord(value.checks) || !Object.entries(value.checks).every(([key, result]) => {
    const [node, index] = key.split(':');
    const choice = Object.hasOwn(dialogues, node) ? dialogues[node].choices[Number(index)] : undefined;
    return /^\w+:\d+$/.test(key) && String(Number(index)) === index && choice?.skill && choice.dc && validRoll(result, value.character as CharacterBuild) && result.skill === choice.skill && result.dc === choice.dc;
  })) return false;
  if (value.dialogue !== null && (!isRecord(value.dialogue) || typeof value.dialogue.nodeId !== 'string' || !Object.hasOwn(dialogues, value.dialogue.nodeId) || typeof value.dialogue.result !== 'string' || value.dialogue.result.length > 500 || !Number.isInteger(value.dialogue.revealed) || Number(value.dialogue.revealed) < 0 || Number(value.dialogue.revealed) > 10000)) return false;
  if (isRecord(value.dialogue)) {
    const node = dialogues[value.dialogue.nodeId as string];
    const text = `${node.speaker} (dialog adaptacyjny)\n\n${node.text}${value.dialogue.result ? '\n\n' + value.dialogue.result : ''}`;
    if (Number(value.dialogue.revealed) > Array.from(text).length) return false;
  }
  if (isRecord(value.dialogue) && value.dialogue.result && !Object.values(value.checks).some(r => formatRoll(r as RollResult) === (value.dialogue as Record<string, unknown>).result)) return false;
  if (typeof value.cardOpen !== 'boolean' || (value.cardOpen && value.dialogue !== null)) return false;
  if (!isRecord(value.movement) || typeof value.movement.talkPending !== 'boolean' || typeof value.movement.flipX !== 'boolean' || !Array.isArray(value.movement.path) || value.movement.path.length > 128 || !value.movement.path.every(boundedPoint)) return false;
  let previous = value.position;
  for (const p of value.movement.path) { if (!canWalk(previous, p)) return false; previous = p; }
  if (value.movement.talkPending && (previous.x !== square.piotr.approach.x || previous.y !== square.piotr.approach.y)) return false;
  return true;
}
export function decodeSave(raw: string): Save {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Zapis jest uszkodzony (nieprawidłowy format).'); }
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) throw new Error('Nieobsługiwana wersja zapisu. Slot pozostaje zachowany.');
  // v1 stored state fields directly; missing UI/movement fields get safe defaults.
  const state = value.version === 1 ? { character: value.character, scene: value.scene, position: value.position, flags: value.flags, checks: value.checks, dialogue: isRecord(value.dialogue) ? { ...value.dialogue, revealed: value.dialogue.revealed ?? 0 } : value.dialogue ?? null, cardOpen: value.cardOpen ?? false, movement: value.movement ?? { path: [], talkPending: false, flipX: false } } : value.state;
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt)) || !validateState(state)) throw new Error('Zapis zawiera nieprawidłowy build lub stan gry. Slot pozostaje zachowany.');
  return { version: 2, savedAt: value.savedAt, state };
}
export class SaveStore {
  constructor(private storage: StorageLike = browserStorage) {}
  private key(index: number) { if (!Number.isInteger(index) || index < 1 || index > 3) throw new Error('Nieprawidłowy slot.'); return `choly.save.${index}`; }
  read(index: number): Slot {
    try { const raw = this.storage.getItem(this.key(index)); return raw === null ? { index, status: 'empty' } : { index, status: 'valid', save: decodeSave(raw) }; }
    catch (error) { return { index, status: 'error', message: error instanceof Error ? error.message : 'Nie można odczytać zapisu.' }; }
  }
  slots() { return [1, 2, 3].map(index => this.read(index)); }
  latest(): Save | undefined { return this.slots().filter((s): s is Slot & { status: 'valid'; save: Save } => s.status === 'valid').sort((a, b) => Date.parse(b.save.savedAt) - Date.parse(a.save.savedAt))[0]?.save; }
  write(index: number, state: GameState, confirmed = false): 'saved' | 'confirm' {
    if (!validateState(state)) throw new Error('Nie można zapisać nieprawidłowego stanu gry.');
    const key = this.key(index);
    if (this.storage.getItem(key) !== null && !confirmed) return 'confirm';
    this.storage.setItem(key, JSON.stringify({ version: SAVE_VERSION, savedAt: new Date().toISOString(), state }));
    return 'saved';
  }
}
