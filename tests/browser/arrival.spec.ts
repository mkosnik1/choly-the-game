import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { StoryNode, Check } from '../../src/content/story';
const story = JSON.parse(readFileSync(new URL('../../src/content/arrival.dialogue.json', import.meta.url), 'utf8')) as { nodes: Record<string, StoryNode> };
const checks = Object.fromEntries(Object.values(story.nodes).flatMap(n => n.choices.flatMap(c => c.check ? [[c.check.id, c.check]] : []))) as Record<string, Check>;
const bands = JSON.parse(readFileSync(new URL('../../src/content/difficulty.json', import.meta.url), 'utf8')).bands as { min: number; max: number; label: string; color: string }[];
const describeDifficulty = (dc: number) => bands.find(b => dc >= b.min && dc <= b.max)!;
import { beginNewGame, gameState, choose, screenText, nextDice, canvasClick } from './helpers';
async function saveAndReload(page: Page, slot: number) {
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Zapisz grę', exact: true }).click();
  await page.getByRole('button', { name: `Zapisz w slocie ${slot}`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Zapisano');
  const saved = await page.evaluate((slot: number) => JSON.parse(localStorage.getItem(`choly.save.${slot}`)!), slot);
  expect(saved.version).toBe(3); await page.reload(); await page.getByRole('button', { name: 'Kontynuuj', exact: true }).click();
  await expect.poll(() => gameState(page)).toEqual(saved.state);
  return saved.state;
}
async function assertDifficulty(page: Page, index: number, id: string) {
  const button = await page.evaluate(async (index: number) => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    const scene = game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused());
    const text = scene.dialog.list.find((o: any) => o.name === `dialogue-choice-${index}`);
    return { text: text.text, color: text.style.color };
  }, index);
  const band = describeDifficulty(checks[id].dc);
  expect(button.text).toContain(band.label); expect(button.color).toBe(band.color); expect(button.text).not.toContain('%');
}
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  test(`entire chapter with all four failed checks and persistent progress at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90000); await page.setViewportSize(viewport); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await beginNewGame(page); const build = (await gameState(page)).character;
    await page.screenshot({ path: `test-results/arrival-${viewport.width}.png` });
    await page.keyboard.press('k'); await expect.poll(() => screenText(page)).toContain('JERZY DROZD'); await choose(page);
    expect((await gameState(page)).dialogue.nodeId).toBe('intro');
    const alternative: Record<string, number> = { intro: 1, warsaw: 1, inspection: 1, confidential: 1, secret: 1, informant: 0, newspaper: 1, witnesses: 0 };
    for (let steps = 0; (await gameState(page)).scene === 'Arrival' && steps < 20; steps++) {
      const node = (await gameState(page)).story.nodeId, index = alternative[node] ?? 0, check = story.nodes[node].choices[index].check;
      if (check) { await assertDifficulty(page, index, check.id); await nextDice(page, 0); }
      await choose(page, index);
      if (check) { const r = (await gameState(page)).checks[check.id]; expect(r.dice).toEqual([1, 1]); expect(r.success).toBe(false); await expect.poll(() => screenText(page)).toContain(check.failureText); }
      if (node === 'confidential' && viewport.width === 1280) {
        const saved = await saveAndReload(page, 1); expect(saved.scene).toBe('Arrival'); expect(saved.story.nodeId).toBe('secret'); expect(saved.checks.andrzej_empathy.success).toBe(false);
      }
      if (node === 'village_enter') break;
    }
    await expect.poll(() => page.evaluate(async () => { const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); return game.scene.isActive('Square'); })).toBe(true);
    expect((await gameState(page)).dialogue).toBeNull(); expect((await gameState(page)).story.lastTone).toBe('distant');
    await canvasClick(page, 540, 410); await expect.poll(async () => Math.abs((await gameState(page)).position.x - 540), { timeout: 10000 }).toBeLessThan(3);
    await page.keyboard.press('j'); await expect.poll(() => screenText(page)).toContain(story.nodes.witnesses.journal![0]); await choose(page);
    await canvasClick(page, 690, 300); await expect.poll(async () => (await gameState(page)).dialogue?.nodeId, { timeout: 10000 }).toBe('piotr_intro');
    await choose(page, 1); await assertDifficulty(page, 0, 'piotr_doctor_jab'); await nextDice(page, 0); await choose(page, 0);
    await expect.poll(() => screenText(page)).toContain(checks.piotr_doctor_jab.failureText);
    if (viewport.width === 1280) { const saved = await saveAndReload(page, 2); expect(saved.scene).toBe('Square'); expect(saved.story.nodeId).toBe('piotr_calm_result'); }
    await choose(page); await assertDifficulty(page, 1, 'piotr_lodging'); await nextDice(page, 0); await choose(page, 1);
    await expect.poll(() => screenText(page)).toContain(checks.piotr_lodging.failureText); await choose(page); await choose(page);
    expect((await gameState(page)).story.nodeId).toBe('scene_end'); await expect.poll(() => screenText(page)).toContain('Koniec rozdziału');
    const completed = await gameState(page);
    expect(completed.character).toEqual(build); expect(Object.keys(completed.checks).sort()).toEqual(Object.keys(checks).sort());
    for (const r of Object.values(completed.checks) as any[]) { expect(r.success).toBe(false); expect(r.dice).toEqual([1, 1]); }
    for (const flag of Object.values(story.nodes).flatMap(n => n.onEnterFlags ?? [])) expect(completed.flags[flag]).toBe(true);
    await page.screenshot({ path: `test-results/chapter-ending-${viewport.width}.png` });
    if (viewport.width === 1280) { const saved = await saveAndReload(page, 3); expect(saved.flags.chestnut_collected).toBe(true); expect(saved.checks).toEqual(completed.checks); }
    await choose(page); await canvasClick(page, 500, 420); await expect.poll(async () => Math.abs((await gameState(page)).position.x - 500), { timeout: 10000 }).toBeLessThan(3);
    expect(errors).toEqual([]);
  });
}
test('legacy v2 square save continues the prepared chapter without changing the old roll', async ({ page }) => {
  await page.goto('/');
  const legacy = { version: 2, savedAt: new Date().toISOString(), state: { character: { name: 'Jerzy Drozd', attributes: { Intelekt: 4, Psychika: 3, Percepcja: 3, Instynkt: 2 }, skills: { Analiza: 1, Dedukcja: 2, Wiedza: 2, Empatia: 2, Perswazja: 1, Opanowanie: 1, Spostrzegawczość: 1, Intuicja: 0, Nasłuchiwanie: 0, Przetrwanie: 0, Refleks: 1, Folklor: 0 } }, scene: 'Square', position: { x: 650, y: 330 }, flags: { piotrMet: true }, checks: { 'document:0': { dice: [1, 1], total: 6, bonus: 4, modifiers: 0, dc: 13, success: false, exceptional: false, skill: 'Opanowanie' } }, dialogue: { nodeId: 'end', result: 'TEST Opanowanie: [1 + 1] + 4 = 6 / 13 — PORAŻKA', revealed: 50 }, cardOpen: false, movement: { path: [], talkPending: false, flipX: false } } };
  const raw = JSON.stringify(legacy); await page.evaluate(raw => localStorage.setItem('choly.save.1', raw), raw);
  await page.reload(); await page.getByRole('button', { name: 'Kontynuuj', exact: true }).click();
  await expect.poll(() => screenText(page)).toContain('[1 + 1] + 4 = 6 / 13 — ✕ PORAŻKA');
  while ((await gameState(page)).story.nodeId !== 'scene_end') await choose(page);
  expect((await gameState(page)).checks['document:0']).toEqual(legacy.state.checks['document:0']);
  expect(await page.evaluate(() => localStorage.getItem('choly.save.1'))).toBe(raw);
  expect((await gameState(page)).flags.scene_002_intro_complete).toBe(true);
});
