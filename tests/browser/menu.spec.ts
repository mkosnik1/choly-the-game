import { test, expect } from '@playwright/test';
import { startNewGame, gameState, canvasClick, choose, reachSquare } from './helpers';
async function screenText(page: any) {
  return page.evaluate(async () => {
    const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src);
    return game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused()).dialog?.list.find((o: any) => o.type === 'Text')?.text ?? '';
  });
}
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  test(`creator constraints and all presets at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.goto('/');
    await expect(page.getByRole('button', { name: 'Kontynuuj', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Nowa gra', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Pozostałe punkty:' })).toContainText('Pozostałe punkty: 8');
    await expect(page.getByRole('button', { name: 'Rozpocznij grę', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Zmniejsz Intelekt' })).toBeDisabled();
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Zwiększ Intelekt' }).click();
    await expect(page.getByRole('button', { name: 'Zwiększ Intelekt' })).toBeDisabled();
    await expect(page.getByLabel('Wartość Intelekt')).toHaveText('6');
    for (const [name, values] of [['Psycholog', [4, 3, 3, 2]], ['Obserwator', [2, 3, 5, 2]], ['Analityk', [6, 3, 2, 1]]] as const) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Pozostałe punkty:' })).toContainText('Pozostałe punkty: 0');
      for (const [i, key] of ['Intelekt', 'Psychika', 'Percepcja', 'Instynkt'].entries()) await expect(page.getByLabel(`Wartość ${key}`)).toHaveText(String(values[i]));
    }
    await page.screenshot({ path: `test-results/creator-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
    await expect(page.locator('#menu-root')).toBeHidden();
    await expect.poll(async () => (await gameState(page))?.character.attributes.Intelekt).toBe(6);
    await page.keyboard.press('k'); await expect.poll(() => screenText(page)).toContain('Dedukcja: 2 (premia 8)');
    await expect(page.getByRole('button', { name: 'Zwiększ Intelekt' })).toHaveCount(0);
  });
}
test('custom build, three slots, overwrite cancellation, reload and preserved dice', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Nowa gra', exact: true }).click();
  await page.getByRole('button', { name: 'Psycholog', exact: true }).click();
  await page.getByRole('button', { name: 'Zmniejsz Intelekt' }).click(); await page.getByRole('button', { name: 'Zmniejsz Intelekt' }).click();
  await page.getByRole('button', { name: 'Zmniejsz Percepcja' }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Zwiększ Psychika' }).click();
  await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  await reachSquare(page); await canvasClick(page, 690, 300); await expect.poll(async () => (await gameState(page))?.dialogue?.nodeId, { timeout: 10000 }).toBe('piotr_intro');
  await canvasClick(page, 180, 400); await expect.poll(() => screenText(page)).toContain('Piotr');
  // Difficulty is described by DC; the selected Psychika 6 still contributes to the roll bonus.
  const choices = await page.evaluate(async () => { const { game } = await import(document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src); return game.scene.getScenes(false).find((s: any) => s.sys.isActive() || s.sys.isPaused()).dialog.list.filter((o: any) => o.type === 'Text').map((o: any) => o.text).join('\n'); });
  expect(choices).toContain('Łatwy');
  await page.evaluate(() => { const original = Math.random; let dice = 2; Math.random = () => { if (dice-- > 0) return 0; Math.random = original; return original(); }; });
  await canvasClick(page, 180, 400); await expect.poll(() => screenText(page)).toContain('[1 + 1] + 7 = 9 / 9 — ✓ SUKCES');
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Zapisz grę', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz w slocie 1', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Zapisano grę w slocie 1');
  const original = await page.evaluate(() => localStorage.getItem('choly.save.1'));
  const saved = JSON.parse(original!).state;
  await page.getByRole('button', { name: 'Zapisz w slocie 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nadpisać zapis?' })).toBeVisible();
  await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('choly.save.1'))).toBe(original);
  await page.getByRole('button', { name: 'Zapisz w slocie 1', exact: true }).click();
  await page.getByRole('button', { name: 'Potwierdź', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Zapisano');
  await page.getByRole('button', { name: 'Zapisz w slocie 2', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz w slocie 3', exact: true }).click();
  const allSlots = await page.evaluate(() => [1, 2, 3].map(n => localStorage.getItem(`choly.save.${n}`)));
  await page.reload(); await expect(page.getByRole('button', { name: 'Kontynuuj', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click(); await page.getByRole('button', { name: 'Obserwator', exact: true }).click();
  await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  expect(await page.evaluate(() => [1, 2, 3].map(n => localStorage.getItem(`choly.save.${n}`)))).toEqual(allSlots);
  await page.reload(); await page.getByRole('button', { name: 'Kontynuuj', exact: true }).click();
  await expect.poll(() => gameState(page)).toEqual(saved);
  await expect.poll(() => screenText(page)).toContain('[1 + 1] + 7 = 9 / 9 — ✓ SUKCES');
  while ((await gameState(page)).story.nodeId !== 'scene_end') await choose(page);
  await choose(page); expect((await gameState(page)).checks).toEqual(saved.checks);
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Menu główne', exact: true }).click();
  await page.getByRole('button', { name: 'Anuluj', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Pauza', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Menu główne', exact: true }).click(); await page.getByRole('button', { name: 'Potwierdź', exact: true }).click();
  await page.getByRole('button', { name: 'Wczytaj grę', exact: true }).click(); await page.getByRole('button', { name: 'Wczytaj slot 1', exact: true }).click();
  await expect.poll(() => gameState(page)).toEqual(saved);
});
test('escape pauses movement and saving restores a pending route', async ({ page }) => {
  await startNewGame(page); await canvasClick(page, 30, 120); await page.keyboard.press('Escape');
  const before = await gameState(page); await page.waitForTimeout(250); expect(await gameState(page)).toEqual(before);
  await page.getByRole('button', { name: 'Zapisz grę', exact: true }).click(); await page.getByRole('button', { name: 'Zapisz w slocie 1', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Zapisano');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('choly.save.1')!).state);
  expect(saved.movement.path.length).toBeGreaterThan(0);
  await page.reload(); await page.getByRole('button', { name: 'Kontynuuj', exact: true }).click();
  await expect.poll(async () => Math.abs((await gameState(page)).position.x - 30), { timeout: 20000 }).toBeLessThan(3);
});
test('settings persist, fullscreen toggles and slow dialogue pauses and can be revealed', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  const music = page.getByRole('slider', { name: 'Głośność muzyki' }); await music.focus(); await music.press('Home');
  for (let i = 0; i < 25; i++) await music.press('ArrowRight');
  await page.getByRole('slider', { name: 'Głośność efektów' }).focus(); await page.keyboard.press('End');
  await page.getByLabel('Szybkość wyświetlania dialogów').selectOption('15');
  await page.getByRole('checkbox', { name: 'Pełny ekran' }).check(); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.getByRole('checkbox', { name: 'Pełny ekran' }).uncheck(); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await page.reload(); await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Głośność muzyki' })).toHaveValue('25'); await expect(page.getByRole('slider', { name: 'Głośność efektów' })).toHaveValue('100');
  await expect(page.getByLabel('Szybkość wyświetlania dialogów')).toHaveValue('15');
  await page.getByRole('button', { name: 'Wróć', exact: true }).click();
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click(); await page.getByRole('button', { name: 'Psycholog', exact: true }).click(); await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  await expect.poll(async () => (await gameState(page))?.dialogue?.nodeId, { timeout: 10000 }).toBe('intro');
  expect((await screenText(page)).length).toBeLessThan(100);
  await page.keyboard.press('Escape'); const text = await screenText(page); await page.waitForTimeout(300); expect(await screenText(page)).toBe(text);
  await page.getByRole('button', { name: 'Wznów', exact: true }).click(); await canvasClick(page, 500, 300);
  await expect.poll(() => screenText(page)).toContain('Na długo pan do nas zawitał?');
});
test('invalid slots remain intact and cannot be loaded', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => { localStorage.setItem('choly.save.1', 'broken'); localStorage.setItem('choly.save.2', '{"version":999}'); });
  await page.reload(); await expect(page.getByRole('button', { name: 'Kontynuuj', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Wczytaj grę', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wczytaj slot 1', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Wczytaj slot 2', exact: true })).toBeDisabled();
  await expect(page.getByText('Nieobsługiwana wersja zapisu. Slot pozostaje zachowany.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('choly.save.1'))).toBe('broken');
});

test('saving preserves revealed dialogue progress and speed changes affect an open dialogue', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await page.getByLabel('Szybkość wyświetlania dialogów').selectOption('15');
  await page.getByRole('button', { name: 'Wróć', exact: true }).click();
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click(); await page.getByRole('button', { name: 'Psycholog', exact: true }).click(); await page.getByRole('button', { name: 'Rozpocznij grę', exact: true }).click();
  await expect.poll(async () => (await gameState(page))?.dialogue?.nodeId, { timeout: 10000 }).toBe('intro');
  await expect.poll(async () => (await screenText(page)).length).toBeGreaterThan(3);
  await page.keyboard.press('Escape'); const prefix = await screenText(page);
  await page.getByRole('button', { name: 'Zapisz grę', exact: true }).click(); await page.getByRole('button', { name: 'Zapisz w slocie 1', exact: true }).click();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('choly.save.1')!));
  expect(save.state.dialogue.revealed).toBe(Array.from(prefix).length);
  await page.reload(); await page.getByRole('button', { name: 'Kontynuuj', exact: true }).click();
  await page.keyboard.press('Escape'); expect(await screenText(page)).toMatch(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click(); await page.getByLabel('Szybkość wyświetlania dialogów').selectOption('0');
  await expect.poll(() => screenText(page)).toContain('Na długo pan do nas zawitał?');
  expect((await gameState(page)).character).toEqual(save.state.character);
});
