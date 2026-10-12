import { DialogueController } from '../src/systems/dialogue';
import { GameSession } from '../src/state/session';
import { presets } from '../src/state/character';
export function driveToSquare(session: GameSession, tests = false, random = () => 0) {
  const dialogue = new DialogueController(session);
  for (let steps = 0; session.state.scene === 'Arrival' && steps < 30; steps++) {
    const node = session.state.story.nodeId;
    const choice = tests && node === 'confidential' ? 1 : !tests && node === 'informant' ? 1 : 0;
    dialogue.choose(choice, random);
  }
  return dialogue;
}
export function squareSession(profile = presets.Psycholog) { const session = new GameSession(profile); driveToSquare(session); return session; }
export function meetPiotr(session: GameSession, random = () => 0) {
  const dialogue = new DialogueController(session); dialogue.start(); dialogue.choose(0); dialogue.choose(0, random); return dialogue;
}
