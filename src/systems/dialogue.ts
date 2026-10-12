import { dialogues } from '../dialogues';
import { chance, roll, type RollResult } from '../rpg';
import type { GameSession } from '../state/session';
export function formatRoll(r: RollResult) {
  return `TEST ${r.skill}: [${r.dice.join(' + ')}] + ${r.bonus} = ${r.total} / ${r.dc} — ${r.exceptional ? 'SUKCES WYJĄTKOWY' : r.success ? 'SUKCES' : 'PORAŻKA'}`;
}
export class DialogueController {
  constructor(private session: GameSession) {}
  start() { this.session.update({ dialogue: { nodeId: 'intro', result: '', revealed: 0 }, cardOpen: false, flags: { ...this.session.state.flags, piotrMet: true } }); }
  view() {
    const current = this.session.state.dialogue!;
    const node = dialogues[current.nodeId], build = this.session.state.character;
    return {
      text: `${node.speaker} (dialog adaptacyjny)\n\n${node.text}${current.result ? '\n\n' + current.result : ''}`,
      choices: node.choices.length ? node.choices.map((choice, i) => ({ label: choice.label + (choice.skill && choice.dc ?
        (this.session.state.checks[`${current.nodeId}:${i}`] ? ' — wynik zapisany' : ` — szansa ${chance(choice.skill, choice.dc, 0, build)}%`) : ''), next: choice.next })) : [{ label: 'Zakończ rozmowę', next: '' }]
    };
  }
  choose(index: number, random = Math.random) {
    const current = this.session.state.dialogue!;
    const choice = dialogues[current.nodeId].choices[index];
    if (!choice) { this.session.update({ dialogue: null, flags: { ...this.session.state.flags, conversationFinished: true } }); return; }
    let result = '';
    if (choice.skill && choice.dc) {
      const key = `${current.nodeId}:${index}`;
      const r = this.session.state.checks[key] ?? roll(choice.skill, choice.dc, random, 0, this.session.state.character);
      result = formatRoll(r);
      this.session.update({ checks: { ...this.session.state.checks, [key]: r } });
    }
    this.session.update({ dialogue: { nodeId: choice.next, result, revealed: 0 } });
  }
}
