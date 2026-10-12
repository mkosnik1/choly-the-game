import { describe, it, expect } from 'vitest';
import { createCharacter, presets, initialSkills, validAttributes, adjustAttribute, remainingPoints, type Attributes } from '../src/state/character';
import { bonus, chance, roll } from '../src/rpg';
import { GameSession } from '../src/state/session';
import { DialogueController } from '../src/systems/dialogue';
import { SaveStore, decodeSave, validateState, type StorageLike } from '../src/state/saves';
import { SettingsStore, validSettings } from '../src/state/settings';
class Memory implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}
describe('character allocation and immutable active build', () => {
  it.each(Object.entries(presets))('%s uses exactly 12 points and keeps all initial ranks', (_, attributes) => {
    expect(validAttributes(attributes)).toBe(true); expect(remainingPoints(attributes)).toBe(0);
    expect(createCharacter(attributes).skills).toEqual(initialSkills);
  });
  it.each([0, 7, 1.5, NaN, Infinity])('rejects attribute %s even with a plausible sum', value => {
    expect(validAttributes({ ...presets.Psycholog, Intelekt: value })).toBe(false);
  });
  it('rejects incomplete/excess allocations and respects both bounds while adjusting', () => {
    expect(validAttributes({ ...presets.Psycholog, Instynkt: 1 })).toBe(false);
    expect(validAttributes({ ...presets.Psycholog, Instynkt: 3 })).toBe(false);
    const minimum = { Intelekt: 1, Psychika: 1, Percepcja: 1, Instynkt: 1 };
    expect(adjustAttribute(minimum, 'Intelekt', -1)).toEqual(minimum);
    expect(remainingPoints(adjustAttribute(minimum, 'Intelekt', 1))).toBe(7);
    expect(adjustAttribute(presets.Analityk, 'Intelekt', 1)).toEqual(presets.Analityk);
    expect(adjustAttribute(presets.Psycholog, 'Instynkt', 1)).toEqual(presets.Psycholog);
    expect(() => createCharacter(minimum)).toThrow();
  });
  it('uses selected attributes in bonuses, probabilities and dice results', () => {
    const psychologist = createCharacter(presets.Psycholog), analyst = createCharacter(presets.Analityk);
    expect(bonus('Dedukcja', 0, psychologist)).toBe(6); expect(bonus('Dedukcja', 0, analyst)).toBe(8);
    expect(chance('Dedukcja', 13, 0, analyst)).toBeGreaterThan(chance('Dedukcja', 13, 0, psychologist));
    expect(roll('Dedukcja', 13, () => 0.5, -2, analyst)).toMatchObject({ dice: [4, 4], bonus: 6, total: 14, success: true });
    for (const build of Object.values(presets).map(createCharacter)) {
      let successes = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const values = [(a - 1) / 6, (b - 1) / 6]; if (roll('Spostrzegawczość', 13, () => values.shift()!, 0, build).success) successes++; }
      expect(chance('Spostrzegawczość', 13, 0, build)).toBe(Math.round(successes / 36 * 1000) / 10);
    }
  });
  it('copies creator inputs and protects an active character from changes', () => {
    const attributes = { ...presets.Analityk }, session = new GameSession(attributes); attributes.Intelekt = 1;
    expect(session.state.character.attributes.Intelekt).toBe(6);
    expect(() => { (session.state.character.attributes as Attributes).Intelekt = 1; }).toThrow();
    const copy = session.snapshot(); copy.character = createCharacter(presets.Obserwator);
    session.update({ flags: { piotrMet: true } }); expect(session.state.character.attributes.Intelekt).toBe(6);
    expect(() => session.update({ character: createCharacter(presets.Obserwator) } as any)).toThrow();
  });
});
describe('three save slots, round trip and migration', () => {
  it('restores the exact build, ranks, position, flags, dialogue and performed roll', () => {
    const storage = new Memory(), saves = new SaveStore(storage), session = new GameSession(presets.Obserwator);
    session.update({ position: { x: 500.25, y: 400.75 } });
    const dialogue = new DialogueController(session); dialogue.start(); dialogue.choose(0); dialogue.choose(0, () => 0);
    expect(saves.write(1, session.snapshot())).toBe('saved');
    const slot = saves.read(1); expect(slot.status).toBe('valid');
    if (slot.status !== 'valid') throw new Error('Expected save');
    const restored = new GameSession(slot.save.state.character.attributes, slot.save.state);
    expect(restored.snapshot()).toEqual(session.snapshot());
    new DialogueController(restored).start(); const replay = new DialogueController(restored); replay.choose(0); replay.choose(0, () => { throw new Error('Must not reroll'); });
    expect(restored.state.checks).toEqual(session.state.checks);
  });
  it('requires confirmation even for corrupt occupied slots and preserves other slots', () => {
    const storage = new Memory(), saves = new SaveStore(storage), state = new GameSession(presets.Psycholog).snapshot();
    storage.data.set('choly.save.1', 'corrupt'); saves.write(2, state); const other = storage.getItem('choly.save.2');
    expect(saves.write(1, state)).toBe('confirm'); expect(storage.getItem('choly.save.1')).toBe('corrupt');
    expect(saves.write(1, state, true)).toBe('saved'); expect(storage.getItem('choly.save.2')).toBe(other);
    expect(saves.slots()).toHaveLength(3); expect(() => saves.write(4, state)).toThrow();
  });
  it('new sessions leave saved games untouched and continue selects newest valid slot', () => {
    const storage = new Memory(), saves = new SaveStore(storage), state = new GameSession(presets.Analityk).snapshot();
    storage.setItem('choly.save.1', JSON.stringify({ version: 2, savedAt: '2026-10-10T10:00:00Z', state }));
    storage.setItem('choly.save.2', JSON.stringify({ version: 2, savedAt: '2026-10-11T10:00:00Z', state }));
    storage.setItem('choly.save.3', 'broken'); const before = [...storage.data]; new GameSession(presets.Obserwator);
    expect([...storage.data]).toEqual(before); expect(saves.latest()?.savedAt).toBe('2026-10-11T10:00:00Z');
  });
  it('migrates flat v1 without writing or deleting its original data', () => {
    const storage = new Memory(), state = new GameSession(presets.Analityk).snapshot();
    const { movement, cardOpen, dialogue, ...legacy } = state;
    const raw = JSON.stringify({ version: 1, savedAt: '2026-10-11T10:00:00Z', ...legacy });
    storage.setItem('choly.save.1', raw); const slot = new SaveStore(storage).read(1);
    expect(slot.status).toBe('valid'); if (slot.status === 'valid') expect(slot.save.state).toEqual(state);
    expect(storage.getItem('choly.save.1')).toBe(raw);
  });
  it.each(['not-json', '{"version":999}', '{"version":2,"savedAt":"oops","state":{}}'])('reports corrupt/unsupported records without removing them: %s', raw => {
    const storage = new Memory(); storage.setItem('choly.save.1', raw);
    expect(new SaveStore(storage).read(1).status).toBe('error'); expect(storage.getItem('choly.save.1')).toBe(raw);
    expect(() => decodeSave(raw)).toThrow();
  });
  it('rejects tampered rolls, invalid builds, unsupported scenes and positions inside obstacles', () => {
    const session = new GameSession(presets.Psycholog), dialogue = new DialogueController(session);
    dialogue.start(); dialogue.choose(0); dialogue.choose(0, () => 0);
    for (const mutate of [
      (s: any) => s.character.attributes.Intelekt = 9,
      (s: any) => s.character.skills.Analiza = -1,
      (s: any) => s.scene = '003',
      (s: any) => s.position = { x: 100, y: 100 },
      (s: any) => s.checks['document:0'].total = 99,
      (s: any) => s.checks['document:0'].dice = [0, 7],
      (s: any) => s.dialogue.result = 'Fałszywy wynik',
      (s: any) => s.dialogue.revealed = -1,
      (s: any) => s.dialogue.revealed = 10000,
      (s: any) => s.checks = { '__proto__:0': s.checks['document:0'] },
      (s: any) => s.checks = { 'document:00': s.checks['document:0'] }
    ]) { const state = session.snapshot(); mutate(state); expect(validateState(state)).toBe(false); }
  });
  it('keeps movement routes and rejects routes through obstacles', () => {
    const session = new GameSession(presets.Psycholog);
    session.update({ movement: { path: [{ x: 500, y: 400 }], talkPending: false, flipX: false } });
    expect(validateState(session.snapshot())).toBe(true);
    session.update({ movement: { path: [{ x: 30, y: 120 }], talkPending: false, flipX: false } });
    expect(validateState(session.snapshot())).toBe(false);
  });
  it('handles inaccessible storage and failed writes without destroying a previous slot', () => {
    const storage = new Memory(), saves = new SaveStore(storage), state = new GameSession(presets.Analityk).snapshot();
    saves.write(1, state); const old = storage.getItem('choly.save.1');
    storage.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(() => saves.write(1, state, true)).toThrow(); expect(storage.getItem('choly.save.1')).toBe(old);
    storage.getItem = () => { throw new Error('SecurityError'); };
    expect(saves.read(1).status).toBe('error'); expect(saves.latest()).toBeUndefined();
  });
});
describe('persistent settings', () => {
  it('persists both volume channels, dialogue speed and fullscreen preference', () => {
    const storage = new Memory(), settings = new SettingsStore(storage);
    settings.set({ music: 0, effects: 1, dialogueSpeed: 15, fullscreen: true });
    expect(new SettingsStore(storage).value).toEqual(settings.value);
    expect(validSettings({ ...settings.value, music: 1.01 })).toBe(false);
    expect(validSettings({ ...settings.value, dialogueSpeed: 999 })).toBe(false);
  });
  it('falls back from corrupt settings and reports unavailable persistence', () => {
    const storage = new Memory(); storage.setItem('choly.settings', '{}'); const settings = new SettingsStore(storage);
    expect(settings.error).not.toBe(''); expect(settings.value.dialogueSpeed).toBe(0);
    storage.setItem = () => { throw new Error('Quota'); }; settings.set({ music: 0.3 });
    expect(settings.error).not.toBe(''); expect(settings.value.music).toBe(0.3);
  });
});

it('round-trips non-default skill ranks without reverting to starting skills', () => {
  const state = new GameSession(presets.Analityk).snapshot();
  state.character = { ...state.character, skills: { ...state.character.skills, Dedukcja: 5, Folklor: 3 } };
  const saves = new SaveStore(new Memory()); saves.write(1, state);
  const slot = saves.read(1); if (slot.status !== 'valid') throw new Error('Expected save');
  expect(slot.save.state.character).toEqual(state.character);
  expect(bonus('Folklor', 0, slot.save.state.character)).toBe(4);
  expect(bonus('Dedukcja', 0, slot.save.state.character)).toBe(11);
});
