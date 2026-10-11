import { test, expect, type Page } from '@playwright/test';

async function point(page: Page, x: number, y: number) {
  const box = (await page.locator('canvas').boundingBox())!;
  return { x: box.x + x * box.width / 960, y: box.y + y * box.height / 540 };
}
async function frame(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function visualState(page: Page) {
  return page.evaluate(async () => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    const scene = game.scene.getScene('Square');
    if (!scene?.player) return null;
    return {
      moving: scene.player.getData('moving'), texture: scene.playerSprite.texture.key,
      hovered: !!scene.piotr.getData('hovered'), ring: scene.hoverRing.strokeColor,
      x: scene.player.x, y: scene.player.y, depth: scene.player.depth,
      dialogue: !!scene.dialog, text: scene.dialog?.list.filter((o: { type: string }) => o.type === 'Text').map((o: { text: string }) => o.text).join('\n') || ''
    };
  });
}
test('pixel art hover, walking frames, cancel approach and touch-friendly card', async ({ page }) => {
  await page.goto('/');
  await expect.poll(async () => (await visualState(page))?.x).toBe(470);
  await frame(page);
  await page.screenshot({ path: 'test-results/pixel-art-square.png' });
  const baseline = (await visualState(page))!.ring;
  let p = await point(page, 690, 300);
  await page.mouse.move(p.x, p.y);
  await expect.poll(async () => (await visualState(page))?.hovered).toBe(true);
  expect((await visualState(page))!.ring).not.toBe(baseline);
  await page.screenshot({ path: 'test-results/pixel-art-hover.png' });
  p = await point(page, 600, 425); await page.mouse.move(p.x, p.y);
  await expect.poll(async () => (await visualState(page))?.hovered).toBe(false);
  expect((await visualState(page))!.ring).toBe(baseline);
  await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await visualState(page))?.moving).toBe(true);
  // Record actual frames, not merely whether the sprite reports moving.
  const textures = await page.evaluate(async () => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); const scene = game.scene.getScene('Square');
    const keys = new Set<string>();
    await new Promise<void>(resolve => { const record = () => {
      keys.add(scene.playerSprite.texture.key);
      if (!scene.player.getData('moving')) { scene.events.off('postupdate', record); resolve(); }
    }; scene.events.on('postupdate', record); });
    return [...keys];
  });
  expect(textures).toContain('jerzy-1'); expect(textures).toContain('jerzy-2');
  const stopped = (await visualState(page))!;
  expect(stopped.texture).toBe('jerzy-0'); expect(stopped.depth).toBe(stopped.y);
  p = await point(page, 690, 300); await page.mouse.click(p.x, p.y); await frame(page);
  p = await point(page, 500, 425); await page.mouse.click(p.x, p.y);
  await expect.poll(async () => Math.abs((await visualState(page))!.x - 500), { timeout: 10000 }).toBeLessThan(3);
  expect((await visualState(page))!.dialogue).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 }); await frame(page);
  const box = (await page.locator('canvas').boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(16 / 9, 2);
  p = await point(page, 860, 23); await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await visualState(page))?.text).toContain('JERZY DROZD');
  await page.screenshot({ path: 'test-results/pixel-art-card-mobile.png' });
  p = await point(page, 150, 490); await frame(page); await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await visualState(page))?.dialogue).toBe(false);
});
