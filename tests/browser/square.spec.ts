import { test, expect } from '@playwright/test';
// Inspect the running scene while all player actions use real canvas clicks.
async function state(page:any) {
  return page.evaluate(async()=>{
    const {game}=await import('/src/main.ts');
    const scene=game.scene.getScene('Square') as any;
    if(!scene?.player)return {x:null,y:null,dialog:false,text:''};
    return {x:scene.player.x,y:scene.player.y,dialog:!!scene.dialog,text:scene.dialog?.list.filter((o:any)=>o.type==='Text').map((o:any)=>o.text).join('\n')||''};
  });
}
async function click(page:any,x:number,y:number){const box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+x*box.width/960,box.y+y*box.height/540);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
for(const viewport of [{width:1280,height:720},{width:390,height:844}]) {
  test(`movement, Piotr and visible dice at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
    await expect.poll(async()=>(await state(page)).x).toBe(470);
    const box=(await page.locator('canvas').boundingBox())!;
    expect(box.width/box.height).toBeCloseTo(960/540,2);
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
    expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
    await click(page,30,120);await expect.poll(async()=>Math.abs((await state(page)).x-30),{timeout:20000}).toBeLessThan(3);
    await click(page,400,120);
    // The direct segment crosses the shop; verify every animation frame remains outside it.
    const positions=await page.evaluate(async()=>{
      const {game}=await import('/src/main.ts');const scene=game.scene.getScene('Square') as any;
      const points:{x:number;y:number}[]=[];
      await new Promise<void>(resolve=>{const record=()=>{points.push({x:scene.player.x,y:scene.player.y});if(!scene.path.length){scene.events.off('postupdate',record);resolve();}};scene.events.on('postupdate',record);});return points;
    });
    expect(positions.length).toBeGreaterThan(1);
    expect(positions.every(p=>!(p.x>42&&p.x<358&&p.y>52&&p.y<198))).toBe(true);
    expect(Math.abs((await state(page)).x-400)).toBeLessThan(3);
    await click(page,100,100);await page.waitForTimeout(150);expect(Math.abs((await state(page)).x-400)).toBeLessThan(3);
    await click(page,690,300);expect((await state(page)).dialog).toBe(false);
    await expect.poll(async()=>(await state(page)).text,{timeout:20000}).toContain('Piotr Bieniasz');
    await click(page,180,400);await expect.poll(async()=>(await state(page)).text).toContain('szansa 27.8%');
    await page.evaluate(()=>{const original=Math.random;let dice=2;Math.random=()=>{if(dice-->0)return 0;Math.random=original;return original();};});
    await click(page,180,400);await expect.poll(async()=>(await state(page)).text).toContain('[1 + 1] + 4 = 6 / 13 — PORAŻKA');
    await click(page,180,400);await expect.poll(async()=>(await state(page)).dialog).toBe(false);
    await click(page,500,400);await expect.poll(async()=>Math.abs((await state(page)).x-500),{timeout:20000}).toBeLessThan(3);
    await page.keyboard.press('k');await expect.poll(async()=>(await state(page)).text).toContain('Folklor: 0');
    await click(page,150,490);await expect.poll(async()=>(await state(page)).dialog).toBe(false);
    await page.screenshot({path:`test-results/square-${viewport.width}.png`});
    expect(errors).toEqual([]);
  });
}
