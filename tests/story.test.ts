import { describe, it, expect } from 'vitest';
import { story, checks, describeDifficulty, sceneForNode } from '../src/content/story';
import { GameSession } from '../src/state/session';
import { presets, createCharacter } from '../src/state/character';
import { DialogueController, resultText } from '../src/systems/dialogue';
import { roll } from '../src/rpg';
import { validateState, decodeSave } from '../src/state/saves';
import { driveToSquare, squareSession } from './story-fixtures';
describe('PR #3 complete dialogue graph', () => {
  it('walks every prepared choice with failures and reaches the ending without dead ends', () => {
    const visited = new Set<string>(), edges = new Set<string>();
    function walk(session: GameSession, depth = 0) {
      expect(depth).toBeLessThan(30); const nodeId = session.state.story.nodeId, node = story.nodes[nodeId]; visited.add(nodeId);
      expect(validateState(session.snapshot())).toBe(true);
      const engine = new DialogueController(session);
      if (node.mode === 'exploration') { expect(session.state.dialogue).toBeNull(); engine.start(node.exitInteraction); walk(session, depth + 1); return; }
      if (!node.choices.length) {
        expect(nodeId).toBe('scene_end'); expect(session.state.flags.scene_002_intro_complete).toBe(true);
        engine.choose(0); expect(session.state.dialogue).toBeNull(); expect(session.state.scene).toBe('Square'); return;
      }
      node.choices.forEach((choice, i) => {
        expect(Object.hasOwn(story.nodes, choice.next)).toBe(true); edges.add(`${nodeId}:${i}`);
        const copy = new GameSession(session.state.character.attributes, session.snapshot()); new DialogueController(copy).choose(i, () => 0);
        if (choice.check) { const result = copy.state.checks[choice.check.id]; expect(result.success).toBe(false); expect(copy.state.dialogue?.result).toContain(choice.check.failureText); }
        walk(copy, depth + 1);
      });
    }
    walk(new GameSession(presets.Psycholog));
    expect([...visited].sort()).toEqual(Object.keys(story.nodes).sort());
    expect(edges.size).toBe(Object.values(story.nodes).reduce((sum, n) => sum + n.choices.length, 0));
  }, 15000);
  it('retains all entry flags, journal entries and response tone', () => {
    const session = new GameSession(presets.Psycholog), engine = new DialogueController(session);
    engine.choose(1); expect(session.state.story.lastTone).toBe('distant'); driveToSquare(session, true);
    expect(session.state.flags.andrzej_reported).toBe(true); expect(session.state.flags.roman_named_as_source).toBe(true);
    expect(session.state.flags.witness_discrepancy_known).toBe(true); expect(session.state.flags.arrived_in_choly).toBe(true);
    expect(session.state.story.journal).toEqual(story.nodes.witnesses.journal);
    engine.start(); engine.choose(0); engine.choose(0, () => 0); engine.choose(0); engine.choose(1, () => 0); engine.choose(0); engine.choose(0);
    for (const flag of Object.values(story.nodes).flatMap(node => node.onEnterFlags ?? [])) expect(session.state.flags[flag]).toBe(true);
    expect(session.state.story.nodeId).toBe('scene_end'); expect(session.state.scene).toBe('Square');
  });
  it('uses creator statistics and the prepared success/failure interpretations for every check', () => {
    for (const check of Object.values(checks)) for (const preset of Object.values(presets)) {
      const r = roll(check.skill, check.dc, () => 0.999, 0, createCharacter(preset));
      expect(r.bonus).toBe(preset[check.skill === 'Dedukcja' ? 'Intelekt' : 'Psychika'] + (check.skill === 'Dedukcja' || check.skill === 'Empatia' ? 2 : 1));
      expect(resultText(check.id, r)).toContain(r.success ? check.successText : check.failureText);
      expect(resultText(check.id, r)).toContain('[6 + 6]');
    }
  });
  it('shows labels/colors by DC, never percentage probabilities', () => {
    expect(describeDifficulty(6).label).toBe('Banalny'); expect(describeDifficulty(7).label).toBe('Łatwy');
    expect(describeDifficulty(9).color).toBe('#76b48c'); expect(describeDifficulty(10).label).toBe('Umiarkowany');
    expect(describeDifficulty(13).label).toBe('Wymagający'); expect(describeDifficulty(16).label).toBe('Trudny'); expect(describeDifficulty(19).label).toBe('Ekstremalny');
    const session = new GameSession(presets.Psycholog), engine = new DialogueController(session); engine.choose(0); engine.choose(0); engine.choose(0);
    expect(session.state.story.nodeId).toBe('confidential'); expect(engine.view().choices[1]).toMatchObject({ color: '#b5ad72' });
    expect(engine.view().choices[1].label).toContain('Umiarkowany'); expect(engine.view().choices[1].label).not.toContain('%');
  });
  it('preserves performed red and white rolls when resuming and loading', () => {
    const session = new GameSession(presets.Psycholog); driveToSquare(session, true);
    const engine = new DialogueController(session); engine.start(); engine.choose(0); engine.choose(0, () => 0);
    const raw = JSON.stringify({ version: 3, savedAt: new Date().toISOString(), state: session.snapshot() });
    const saved = decodeSave(raw), restored = new GameSession(saved.state.character.attributes, saved.state);
    expect(restored.snapshot()).toEqual(session.snapshot());
    for (const [id, nodeId, index] of [['andrzej_empathy', 'confidential', 1], ['piotr_doctor_jab', 'piotr_docs', 0]] as const) {
      const old = restored.state.checks[id];
      restored.update({ story: { ...restored.state.story, nodeId, result: '' }, dialogue: null });
      // Re-entry is a test fixture; the UI itself does not offer backward dialogue navigation.
      if (sceneForNode(nodeId) === 'Arrival') { const copy = restored.snapshot(); copy.scene = 'Arrival'; const retry = new GameSession(copy.character.attributes, copy); const d = new DialogueController(retry); d.start(); d.choose(index, () => { throw new Error('Reroll'); }); expect(retry.state.checks[id]).toEqual(old); }
      else { const d = new DialogueController(restored); d.start(); d.choose(index, () => { throw new Error('Reroll'); }); expect(restored.state.checks[id]).toEqual(old); }
    }
  });
  it('migrates v2 Piotr saves and preserves the original DC 13 result without rerolling', () => {
    const build = createCharacter(presets.Psycholog), r = roll('Opanowanie', 13, () => 0, 0, build);
    const legacy = { character: build, scene: 'Square', position: { x: 650, y: 330 }, flags: { piotrMet: true }, checks: { 'document:0': r }, dialogue: { nodeId: 'end', result: `TEST Opanowanie: [1 + 1] + 4 = 6 / 13 — PORAŻKA`, revealed: 20 }, cardOpen: false, movement: { path: [], talkPending: false, flipX: false } };
    const saved = decodeSave(JSON.stringify({ version: 2, savedAt: new Date().toISOString(), state: legacy }));
    expect(saved.state.checks['document:0']).toEqual(r); expect(saved.state.story.nodeId).toBe('piotr_calm_result');
    const session = new GameSession(build.attributes, saved.state); session.update({ story: { ...session.state.story, nodeId: 'piotr_docs', result: '' }, dialogue: null });
    const engine = new DialogueController(session); engine.start(); engine.choose(0, () => { throw new Error('Reroll'); });
    expect(session.state.dialogue?.result).toContain('[1 + 1] + 4 = 6 / 13');
    expect(validateState(session.snapshot())).toBe(true);
  });
});
