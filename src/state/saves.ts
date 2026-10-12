import { isRecord, validAttributes, validSkills, type CharacterBuild } from './character';
import { bonus, type RollResult } from '../rpg';
import { story, checks, sceneForNode, dialogueText } from '../content/story';
import { resultText } from '../systems/dialogue';
import { square } from '../data/square';
import { canWalk, findPath, type Point } from '../navigation';
import type { GameState } from './session';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export const browserStorage: StorageLike = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
export const SAVE_VERSION = 3;
export type Save = { version: 3; savedAt: string; state: GameState };
export type Slot = { index: number } & ({ status: 'empty' } | { status: 'valid'; save: Save } | { status: 'error'; message: string });
const boundedPoint = (v: unknown): v is Point => isRecord(v) && typeof v.x === 'number' && typeof v.y === 'number' && Number.isFinite(v.x) && Number.isFinite(v.y) && v.x >= square.bounds.left && v.x <= square.bounds.right && v.y >= square.bounds.top && v.y <= square.bounds.bottom && findPath(v as Point, v as Point).length > 0;
function validRoll(value: unknown, build: CharacterBuild): value is RollResult {
  if (!isRecord(value) || !Array.isArray(value.dice) || value.dice.length !== 2 || !value.dice.every(n => Number.isInteger(n) && n >= 1 && n <= 6) || typeof value.skill !== 'string' || !(value.skill in build.skills) || !Number.isInteger(value.dc) || !Number.isInteger(value.modifiers)) return false;
  const r = value as unknown as RollResult;
  const premia = bonus(r.skill, r.modifiers, build), total = r.dice[0] + r.dice[1] + premia;
  return r.bonus === premia && r.total === total && r.success === (total >= r.dc) && r.exceptional === (total >= r.dc + 5);
}
export function validateState(value: unknown): value is GameState {
  if (!isRecord(value) || !isRecord(value.character) || value.character.name !== 'Jerzy Drozd' || !validAttributes(value.character.attributes) || !validSkills(value.character.skills) || !['Arrival', 'Square'].includes(String(value.scene)) || !boundedPoint(value.position)) return false;
  const progress = value.story;
  if (!isRecord(progress) || typeof progress.nodeId !== 'string' || !Object.hasOwn(story.nodes, progress.nodeId) || sceneForNode(progress.nodeId) !== value.scene || typeof progress.result !== 'string' || progress.result.length > 1000 || ![null, 'distant', 'neutral'].includes(progress.lastTone as string | null)) return false;
  if (!Array.isArray(progress.visited) || progress.visited.length > 100 || !progress.visited.includes(progress.nodeId) || !progress.visited.every(id => typeof id === 'string' && Object.hasOwn(story.nodes, id)) || new Set(progress.visited).size !== progress.visited.length) return false;
  const journal = Object.values(story.nodes).flatMap(node => node.journal ?? []);
  if (!Array.isArray(progress.journal) || progress.journal.length > journal.length || !progress.journal.every(item => journal.includes(item)) || new Set(progress.journal).size !== progress.journal.length) return false;
  if (!isRecord(value.flags) || Object.keys(value.flags).length > 128 || !Object.entries(value.flags).every(([k, v]) => /^[a-zA-Z][\w-]{0,63}$/.test(k) && typeof v === 'boolean')) return false;
  if (!isRecord(value.checks) || !Object.entries(value.checks).every(([key, result]) => {
    const legacy = key === 'document:0';
    const check = Object.hasOwn(checks, key) ? checks[key] : legacy ? checks.piotr_doctor_jab : undefined;
    return !!check && validRoll(result, value.character as CharacterBuild) && result.skill === check.skill && result.dc === (legacy ? 13 : check.dc);
  })) return false;
  if (progress.result && !Object.entries(value.checks).some(([key, r]) => resultText(key === 'document:0' ? 'piotr_doctor_jab' : key, r as RollResult) === progress.result)) return false;
  if (value.dialogue !== null && (!isRecord(value.dialogue) || value.dialogue.nodeId !== progress.nodeId || value.dialogue.result !== progress.result || !Number.isInteger(value.dialogue.revealed) || Number(value.dialogue.revealed) < 0 || Number(value.dialogue.revealed) > Array.from(dialogueText(progress.nodeId, progress.result)).length || story.nodes[progress.nodeId].mode === 'exploration')) return false;
  if (typeof value.cardOpen !== 'boolean' || typeof value.journalOpen !== 'boolean' || Number(value.cardOpen) + Number(value.journalOpen) + Number(value.dialogue !== null) > 1) return false;
  if (!isRecord(value.movement) || typeof value.movement.talkPending !== 'boolean' || typeof value.movement.flipX !== 'boolean' || !Array.isArray(value.movement.path) || value.movement.path.length > 128 || !value.movement.path.every(boundedPoint)) return false;
  if (value.scene === 'Arrival' && (value.movement.path.length || value.movement.talkPending)) return false;
  let previous = value.position;
  for (const p of value.movement.path) { if (!canWalk(previous, p)) return false; previous = p; }
  if (value.movement.talkPending && (previous.x !== square.piotr.approach.x || previous.y !== square.piotr.approach.y)) return false;
  return true;
}
function migrateLegacy(state: unknown): unknown {
  if (!isRecord(state) || state.scene !== 'Square' || !isRecord(state.character) || !validAttributes(state.character.attributes) || !validSkills(state.character.skills) || !isRecord(state.checks) || !isRecord(state.flags)) return state;
  const mapping: Record<string, string> = { intro: 'piotr_intro', document: 'piotr_docs', end: 'piotr_calm_result' };
  const old = state.dialogue;
  if (old !== null && (!isRecord(old) || typeof old.nodeId !== 'string' || !Object.hasOwn(mapping, old.nodeId) || typeof old.result !== 'string')) return state;
  let result = '';
  if (isRecord(old) && old.result) {
    const r = state.checks['document:0'] as RollResult;
    if (!validRoll(r, state.character as CharacterBuild) || old.result !== `TEST ${r.skill}: [${r.dice.join(' + ')}] + ${r.bonus} = ${r.total} / ${r.dc} — ${r.exceptional ? 'SUKCES WYJĄTKOWY' : r.success ? 'SUKCES' : 'PORAŻKA'}`) return state;
    result = resultText('piotr_doctor_jab', r);
  }
  const nodeId = isRecord(old) ? mapping[old.nodeId as string] : state.flags.conversationFinished ? 'piotr_request' : state.flags.piotrMet ? 'piotr_intro' : 'explore';
  return { ...state, journalOpen: false,
    flags: { ...state.flags, arrived_in_choly: true, ...(nodeId === 'piotr_docs' || nodeId === 'piotr_calm_result' ? { research_documents_shown: true } : {}) },
    story: { nodeId, visited: [nodeId], journal: [], lastTone: null, result },
    dialogue: old ? { nodeId, result, revealed: 0 } : null
  };
}
export function decodeSave(raw: string): Save {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Zapis jest uszkodzony (nieprawidłowy format).'); }
  if (!isRecord(value) || ![1, 2, 3].includes(Number(value.version)) || typeof value.version !== 'number') throw new Error('Nieobsługiwana wersja zapisu. Slot pozostaje zachowany.');
  const legacy = value.version === 1 ? { character: value.character, scene: value.scene, position: value.position, flags: value.flags, checks: value.checks, dialogue: value.dialogue ?? null, cardOpen: value.cardOpen ?? false, movement: value.movement ?? { path: [], talkPending: false, flipX: false } } : value.state;
  const state = value.version === 3 ? value.state : migrateLegacy(legacy);
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt)) || !validateState(state)) throw new Error('Zapis zawiera nieprawidłowy build lub stan gry. Slot pozostaje zachowany.');
  return { version: 3, savedAt: value.savedAt, state };
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
