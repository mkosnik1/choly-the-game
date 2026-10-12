import { test, expect } from '@playwright/test';
import { startNewGame, gameState, canvasClick, choose, screenText, nextDice } from './helpers';
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  test(`square exploration, collision and Piotr at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await startNewGame(page); const box = (await page.locator('canvas').boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(16 / 9, 2); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    await canvasClick(page, 30, 120); await expect.poll(async () => Math.abs((await gameState(page)).position.x - 30), { timeout: 20000 }).toBeLessThan(3);
    await canvasClick(page, 400, 120);
    const positions = await page.evaluate(async () => {
      const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); const scene = game.scene.getScene('Square');
      const points: { x: number; y: number }[] = [];
      await new Promise<void>(resolve => { const record = () => { points.push({ x: scene.player.x, y: scene.player.y }); if (!scene.path.length) { scene.events.off('postupdate', record); resolve(); } }; scene.events.on('postupdate', record); }); return points;
    });
    expect(positions.length).toBeGreaterThan(1); expect(positions.every(p => !(p.x > 42 && p.x < 358 && p.y > 52 && p.y < 220))).toBe(true);
    await canvasClick(page, 100, 100); expect(Math.abs((await gameState(page)).position.x - 400)).toBeLessThan(3);
    await canvasClick(page, 690, 300); await expect.poll(async () => (await gameState(page)).dialogue?.nodeId, { timeout: 10000 }).toBe('piotr_intro');
    await choose(page); await nextDice(page, 0); await choose(page);
    await expect.poll(() => screenText(page)).toContain('[1 + 1] + 4 = 6 / 9 — ✕ PORAŻKA');
    while ((await gameState(page)).story.nodeId !== 'scene_end') await choose(page);
    await expect.poll(() => screenText(page)).toContain('Koniec rozdziału'); await choose(page);
    await canvasClick(page, 500, 400); await expect.poll(async () => Math.abs((await gameState(page)).position.x - 500), { timeout: 10000 }).toBeLessThan(3);
    await page.keyboard.press('k'); await expect.poll(() => screenText(page)).toContain('Folklor: 0'); await choose(page);
    await page.screenshot({ path: `test-results/square-${viewport.width}.png` }); expect(errors).toEqual([]);
  });
}
test('successful Piotr roll and alternative replies without tests', async ({ page }) => {
  await startNewGame(page); await canvasClick(page, 690, 300);
  await expect.poll(async () => (await gameState(page)).dialogue?.nodeId, { timeout: 10000 }).toBe('piotr_intro');
  await choose(page, 1); await nextDice(page, 0.999); await choose(page);
  await expect.poll(() => screenText(page)).toContain('[6 + 6] + 4 = 16 / 9 — ✓ SUKCES WYJĄTKOWY');
  await choose(page); await choose(page, 0); await choose(page); await choose(page); await choose(page);
  expect((await gameState(page)).dialogue).toBeNull(); expect(Object.keys((await gameState(page)).checks)).toEqual(['piotr_doctor_jab']);
});
