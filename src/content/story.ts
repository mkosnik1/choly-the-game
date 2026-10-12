import data from './arrival.dialogue.json';
import difficulty from './difficulty.json';
import type { Skill } from '../state/character';
export type Check = { id: string; skill: Skill; dc: number; kind: 'white' | 'red'; successText: string; failureText: string };
export type Choice = { text: string; next: string; tone?: 'distant' | 'neutral'; check?: Check };
export type StoryNode = { speaker: string; text: string; choices: Choice[]; stage?: string; onEnterFlags?: string[]; journal?: string[]; mode?: 'exploration'; exitInteraction?: string; next?: string; nextScene?: string; fallbackScene?: string };
export const story = data as { id: string; version: number; attribution: string; start: string; nodes: Record<string, StoryNode> };
export const checks = Object.fromEntries(Object.values(story.nodes).flatMap(n => n.choices.flatMap(c => c.check ? [[c.check.id, c.check]] : []))) as Record<string, Check>;
const driveNodes = new Set<string>();
function collectDrive(id: string) {
  if (driveNodes.has(id) || story.nodes[id].mode === 'exploration') return;
  driveNodes.add(id); story.nodes[id].choices.forEach(c => collectDrive(c.next));
}
collectDrive(story.start);
export function sceneForNode(id: string): 'Arrival' | 'Square' { return driveNodes.has(id) ? 'Arrival' : 'Square'; }
export function describeDifficulty(dc: number) {
  const band = difficulty.bands.find(b => dc >= b.min && dc <= b.max);
  if (!band) throw new Error(`Brak opisowej trudności dla DC ${dc}.`);
  return band;
}
export function dialogueText(nodeId: string, result = '') {
  const n = story.nodes[nodeId];
  const ending = n.nextScene ? '\n\nKoniec rozdziału. Dalsza podróż do domu sołtysa powstanie w kolejnej scenie. Możesz pozostać na placu.' : '';
  return `${n.speaker} (dialog adaptacyjny)\n\n${n.text}${result ? '\n\n' + result : ''}${n.stage ? '\n\n' + n.stage : ''}${ending}`;
}
