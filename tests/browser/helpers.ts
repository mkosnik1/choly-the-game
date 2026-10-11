import { expect, type Page } from '@playwright/test';
export async function startNewGame(page: Page, preset = 'Psycholog') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await page.getByRole('button', { name: preset, exact: true }).click();
  await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  await expect(page.locator('#menu-root')).toBeHidden();
}
export async function gameState(page: Page) {
  return page.evaluate(async () => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    const scene = game.scene.getScene('Square');
    return scene?.session?.snapshot() ?? null;
  });
}
export async function canvasClick(page: Page, x: number, y: number) {
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + x * box.width / 960, box.y + y * box.height / 540);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
