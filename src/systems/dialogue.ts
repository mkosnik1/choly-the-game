import { story, checks, describeDifficulty, dialogueText, sceneForNode } from '../content/story';
import { roll, type RollResult } from '../rpg';
import type { GameSession } from '../state/session';
export function formatRoll(r: RollResult) {
  return `TEST ${r.skill}: [${r.dice.join(' + ')}] + ${r.bonus} = ${r.total} / ${r.dc} — ${r.exceptional ? '✓ SUKCES WYJĄTKOWY' : r.success ? '✓ SUKCES' : '✕ PORAŻKA'}`;
}
export function resultText(checkId: string, r: RollResult) {
  const check = checks[checkId];
  return `${formatRoll(r)}\n${r.success ? check.successText : check.failureText}`;
}
export function cachedCheck(session: GameSession, id: string) {
  // A v1/v2 square save retains its original Opanowanie DC 13 roll verbatim.
  return session.state.checks[id] ?? (id === 'piotr_doctor_jab' ? session.state.checks['document:0'] : undefined);
}
export class DialogueController {
  constructor(private session: GameSession) {}
  private enter(nodeId: string, result = '') {
    const node = story.nodes[nodeId], state = this.session.state;
    if (sceneForNode(nodeId) === 'Square' && state.scene !== 'Square') this.session.enterSquare();
    const flags = { ...state.flags }; node.onEnterFlags?.forEach(flag => flags[flag] = true);
    this.session.update({ flags, cardOpen: false, journalOpen: false,
      story: { ...state.story, nodeId, result, visited: [...new Set([...state.story.visited, nodeId])], journal: [...new Set([...state.story.journal, ...(node.journal ?? [])])] },
      dialogue: node.mode === 'exploration' ? null : { nodeId, result, revealed: 0 }
    });
  }
  start(interaction = this.session.state.scene === 'Arrival' ? 'andrzej' : 'piotr_bieniasz') {
    const current = story.nodes[this.session.state.story.nodeId];
    if (current.mode === 'exploration') {
      if (interaction !== current.exitInteraction || !current.next) return;
      this.enter(current.next);
    } else this.enter(this.session.state.story.nodeId, this.session.state.story.result);
  }
  view() {
    const current = this.session.state.dialogue!;
    const node = story.nodes[current.nodeId];
    return {
      text: dialogueText(current.nodeId, current.result),
      choices: node.choices.length ? node.choices.map(choice => {
        const cached = choice.check ? cachedCheck(this.session, choice.check.id) : undefined;
        const band = choice.check ? describeDifficulty(cached?.dc ?? choice.check.dc) : undefined;
        return { label: choice.text + (choice.check ? ` — ${band!.label} · ${choice.check.kind === 'red' ? 'czerwony' : 'biały'}${cached ? ' · wynik zapisany' : ''}` : ''), next: choice.next, color: band?.color };
      }) : [{ label: 'Pozostań na placu', next: '', color: undefined }]
    };
  }
  choose(index: number, random = Math.random) {
    const current = this.session.state.dialogue!;
    const node = story.nodes[current.nodeId], choice = node.choices[index];
    if (!choice) {
      if (node.nextScene && node.fallbackScene === 'square_free_exploration') this.session.update({ dialogue: null });
      return;
    }
    let result = '';
    if (choice.check) {
      const cached = cachedCheck(this.session, choice.check.id);
      const r = cached ?? roll(choice.check.skill, choice.check.dc, random, 0, this.session.state.character);
      if (!cached) this.session.update({ checks: { ...this.session.state.checks, [choice.check.id]: r } });
      result = resultText(choice.check.id, r);
    }
    if (choice.tone) this.session.update({ story: { ...this.session.state.story, lastTone: choice.tone } });
    this.enter(choice.next, result);
  }
}
