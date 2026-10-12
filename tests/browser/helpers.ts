import { expect, type Page } from '@playwright/test';
export async function beginNewGame(page: Page, preset = 'Psycholog') {
  await page.goto('/'); await page.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await page.getByRole('button', { name: preset, exact: true }).click();
  await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  await expect(page.locator('#menu-root')).toBeHidden();
  await expect.poll(async () => (await gameState(page))?.scene).toBe('Arrival');
}
export async function gameState(page: Page) {
  return page.evaluate(async () => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    const scene = game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused());
    return scene?.session?.snapshot() ?? null;
  });
}
export async function frameReady(page: Page) {
  await page.evaluate(async () => { const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); await new Promise<void>(resolve => game.events.once('poststep', () => game.events.once('poststep', () => resolve()))); });
}
export async function canvasClick(page: Page, x: number, y: number) {
  await frameReady(page); const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + x * box.width / 960, box.y + y * box.height / 540); await frameReady(page);
}
export async function choose(page: Page, index = 0) {
  await frameReady(page);
  const point = await page.evaluate(async (index: number) => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    const scene = game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused());
    const bounds = scene.dialog.list.find((o: any) => o.name === `dialogue-choice-${index}`).getBounds();
    return { x: bounds.x + Math.min(80, bounds.width / 2), y: bounds.y + bounds.height / 2 };
  }, index);
  await canvasClick(page, point.x, point.y);
}
export async function reachSquare(page: Page) {
  for (let steps = 0; steps < 20 && (await gameState(page)).scene === 'Arrival'; steps++) {
    const node = (await gameState(page)).story.nodeId;
    await choose(page, node === 'informant' ? 1 : 0);
    if (node === 'village_enter') break;
    await expect.poll(async () => (await gameState(page)).story.nodeId).not.toBe(node);
  }
  await expect.poll(() => page.evaluate(async () => { const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); return game.scene.isActive('Square'); })).toBe(true);
  await expect.poll(async () => (await gameState(page)).dialogue).toBeNull();
  await frameReady(page);
}
export async function startNewGame(page: Page, preset = 'Psycholog') { await beginNewGame(page, preset); await reachSquare(page); }
export async function screenText(page: Page) {
  return page.evaluate(async () => { const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); const scene = game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused()); return scene.dialog?.list.find((o: any) => o.type === 'Text')?.text ?? ''; });
}
export async function nextDice(page: Page, value: number) {
  await page.evaluate((value: number) => { const original = Math.random; let remaining = 2; Math.random = () => { if (remaining-- > 0) return value; Math.random = original; return original(); }; }, value);
}
