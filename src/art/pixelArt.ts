import Phaser from 'phaser';

/** Original procedural placeholders, drawn at half resolution and rendered ×2.
 * The texture keys are the replacement contract for later local sprite assets.
 * No downloaded artwork, fonts or runtime network requests are used. */
type Paint = (ctx: CanvasRenderingContext2D) => void;
const ink = '#292d28';
function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
}
function poly(c: CanvasRenderingContext2D, points: number[], color: string) {
  c.fillStyle = color; c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath(); c.fill();
}
function line(c: CanvasRenderingContext2D, a: number[], color: string) {
  c.strokeStyle = color; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]);
  for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); c.stroke();
}
function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}
function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#28332b'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
}
function texture(scene: Phaser.Scene, key: string, width: number, height: number, paint: Paint) {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, width, height)!;
  const ctx = canvas.getContext(); ctx.imageSmoothingEnabled = false;
  paint(ctx); canvas.refresh(); canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
function window(c: CanvasRenderingContext2D, x: number, y: number) {
  rect(c, x - 1, y - 1, 18, 20, '#c5b993'); rect(c, x, y, 16, 18, ink);
  rect(c, x + 2, y + 2, 12, 13, '#53615a'); rect(c, x + 3, y + 3, 4, 10, '#9baf9e');
  rect(c, x + 7, y, 2, 18, '#c4b58d'); rect(c, x, y + 8, 16, 2, '#c4b58d');
  rect(c, x - 3, y + 18, 22, 2, '#4b4738');
}
function building(c: CanvasRenderingContext2D, shop: boolean) {
  shadow(c, 82, 74, 75, 6);
  // Two wall faces, gable, tile planes: all share the same isometric axes.
  poly(c, [10, 31, 98, 59, 98, 76, 10, 48], shop ? '#b7ac87' : '#a59e83');
  poly(c, [98, 59, 149, 35, 149, 52, 98, 76], '#767660');
  poly(c, [10, 31, 54, 7, 98, 59], '#c6ba98');
  poly(c, [6, 30, 51, 3, 145, 29, 98, 57], shop ? '#736351' : '#70685a');
  poly(c, [51, 3, 153, 26, 145, 34, 98, 57, 145, 29], '#514d42');
  // Weathered roof tile rows, clipped to the roof silhouette.
  c.save(); c.beginPath(); c.moveTo(6, 30); c.lineTo(51, 3); c.lineTo(145, 29); c.lineTo(98, 57); c.closePath(); c.clip();
  for (let y = 0; y < 60; y += 5) for (let x = -10; x < 160; x += 9) {
    const offset = (y % 10) ? 4 : 0;
    line(c, [x + offset, y, x + offset + 8, y + 2], '#998169');
    rect(c, x + offset, y + 2, 1, 2, '#4a483e');
  }
  c.restore(); line(c, [6, 30, 98, 57, 153, 26], '#d0b090');
  // Chimney, gutter and cracked plaster.
  poly(c, [117, 18, 117, 5, 126, 3, 132, 6, 132, 21, 126, 24], '#8d7966');
  rect(c, 117, 4, 14, 3, '#3b3b34'); rect(c, 122, 9, 3, 2, '#b39b80');
  line(c, [12, 49, 97, 77, 150, 53], '#4d5145');
  for (let x = 15; x < 94; x += 7) rect(c, x, 48 + (x - 15) * 0.32, 4, 2, '#8d8b70');
  line(c, [16, 40, 19, 43, 18, 47], '#7f7d64');
  window(c, 20, 33); window(c, 69, 49);
  poly(c, [43, 37, 59, 42, 59, 64, 43, 59], '#3d4941');
  line(c, [46, 41, 46, 58, 56, 61, 56, 44], '#7b846b'); rect(c, 54, 53, 2, 2, '#d9b66d');
  poly(c, [41, 60, 60, 66, 66, 63, 47, 57], '#898771');
  if (shop) {
    // The readable local text sign is composited by the scene above the pixel facade.
    poly(c, [15, 26, 84, 47, 84, 55, 15, 34], '#342f29');
    line(c, [16, 27, 84, 48], '#c6b181');
    for (let i = 0; i < 4; i++) {
      rect(c, 111 + i * 7, 56 - i * 3, 6, 9, '#a78655');
      rect(c, 112 + i * 7, 58 - i * 3, 4, 1, '#5f5741');
    }
    rect(c, 113, 54, 2, 5, '#49604a'); rect(c, 120, 51, 2, 5, '#5c644c');
  } else {
    poly(c, [114, 45, 132, 37, 132, 51, 114, 59], '#3b4a41');
    line(c, [122, 42, 122, 55, 114, 50, 131, 43], '#b8ae87');
  }
}
function van(c: CanvasRenderingContext2D) {
  shadow(c, 47, 49, 43, 7);
  poly(c, [6, 23, 34, 9, 85, 25, 57, 42], '#80928c');
  poly(c, [6, 23, 57, 42, 57, 52, 6, 34], '#566d68');
  poly(c, [57, 42, 85, 25, 85, 39, 57, 54], '#3f5754');
  poly(c, [7, 23, 7, 13, 34, 0, 34, 9], '#6a817b');
  poly(c, [7, 13, 34, 0, 84, 16, 85, 25, 34, 9], '#9aa6a0');
  poly(c, [10, 15, 30, 6, 30, 18, 10, 27], '#263e3f');
  poly(c, [58, 21, 80, 15, 80, 27, 59, 39], '#293f3e');
  line(c, [60, 22, 77, 18], '#91b5af');
  for (let i = 0; i < 4; i++) line(c, [34 + i * 8, 15 + i * 2, 34 + i * 8, 33 + i * 2], '#52655e');
  for (const [x, y] of [[20, 38], [64, 47]]) {
    rect(c, x - 5, y - 5, 10, 13, ink); rect(c, x - 3, y - 3, 6, 9, '#54584e'); rect(c, x - 1, y - 1, 2, 4, '#9aa098');
  }
  line(c, [8, 32, 55, 49], '#b3b4a0'); rect(c, 7, 28, 4, 3, '#d7ca99');
  poly(c, [60, 43, 82, 31, 82, 35, 60, 47], '#b8b6a1');
  rect(c, 69, 36, 6, 2, '#222e29'); rect(c, 80, 29, 3, 3, '#c6a56c');
  rect(c, 44, 32, 3, 2, '#303d36');
}
function chestnut(c: CanvasRenderingContext2D) {
  shadow(c, 59, 98, 42, 9);
  poly(c, [53, 95, 55, 44, 63, 42, 65, 94, 72, 100, 46, 100], '#655240');
  line(c, [59, 93, 60, 45, 42, 25], '#aa8254');
  poly(c, [56, 65, 36, 40, 41, 37, 61, 55, 82, 27, 86, 30, 63, 67], '#655240');
  const rand = seeded(902);
  // Pixel clusters with dark undersides, sunlit tips and individual leaf flecks.
  for (const [x, y, r] of [[35, 39, 26], [69, 29, 32], [90, 47, 25], [51, 57, 29], [77, 60, 24]]) {
    for (let yy = -r; yy < r; yy += 3) for (let xx = -r; xx < r; xx += 3) {
      if (xx * xx + yy * yy > r * r * (0.82 + rand() * 0.25)) continue;
      const colors = yy > 12 ? ['#3d5138', '#495d3e', '#566344'] : ['#63764b', '#7b8550', '#89945a', '#526840'];
      rect(c, x + xx, y + yy, 4, 4, colors[Math.floor(rand() * colors.length)]);
      if (rand() > 0.72) rect(c, x + xx, y + yy, 1, 1, '#b1aa65');
    }
  }
  for (let i = 0; i < 30; i++) rect(c, 21 + rand() * 75, 95 + rand() * 8, 2, 1, i % 2 ? '#988052' : '#bdad73');
}
export type PersonKind = 'jerzy' | 'piotr' | 'ochre' | 'green' | 'burgundy';
function person(c: CanvasRenderingContext2D, kind: PersonKind, frame: number) {
  const coat = { jerzy: '#58757c', piotr: '#8a7456', ochre: '#a28758', green: '#6b7b61', burgundy: '#886358' }[kind];
  shadow(c, 14, 29, 10, 3);
  const stride = frame === 0 ? 0 : frame === 1 ? 2 : -2;
  rect(c, 9 - stride, 21, 4, 7, '#343c36'); rect(c, 15 + stride, 21, 4, 7, '#414a43');
  rect(c, 8 - stride, 27, 6, 2, '#252e2a'); rect(c, 15 + stride, 27, 6, 2, '#252e2a');
  rect(c, 8, 11, 12, 12, coat); rect(c, 9, 11, 2, 11, '#b1afa0');
  rect(c, 18, 12, 3, 10, '#48554b'); rect(c, 6, 13 + (frame === 1 ? 1 : 0), 3, 9, coat);
  rect(c, 6, 22, 3, 3, '#bc9574'); rect(c, 20, 21, 3, 3, '#bd9877');
  rect(c, 11, 3, 8, 9, '#c6a17c'); rect(c, 17, 6, 3, 4, '#a87f5a');
  rect(c, 10, 2, 10, 4, '#45463a'); rect(c, 11, 4, 2, 4, '#57503d');
  rect(c, 18, 6, 1, 1, '#232d27'); rect(c, 16, 10, 3, 1, '#86694f');
  if (kind === 'piotr') { rect(c, 7, 3, 16, 2, '#494a3a'); rect(c, 11, 0, 9, 4, '#62644b'); }
  if (kind === 'jerzy') { rect(c, 21, 21, 7, 7, '#6b5943'); rect(c, 23, 19, 3, 2, '#3e4235'); rect(c, 22, 22, 1, 4, '#ae8c60'); }
}
export function createSquareTextures(scene: Phaser.Scene) {
  texture(scene, 'square-ground', 480, 270, c => {
    const rand = seeded(2842);
    rect(c, 0, 0, 480, 270, '#46523f');
    // Small staggered cobbles rather than large repeated diamonds.
    for (let y = 23; y < 249; y += 6) for (let x = -8; x < 480; x += 13) {
      const px = x + (y % 12 ? 6 : 0), py = y + Math.floor(rand() * 2);
      const colors = ['#777c65', '#85876e', '#6c735e', '#929077', '#626d58'];
      poly(c, [px, py, px + 7, py - 2, px + 12, py + 1, px + 5, py + 4], colors[Math.floor(rand() * colors.length)]);
      rect(c, px + 4, py, 3, 1, '#a5a28a');
    }
    // Grass edging and creeping moss at the village boundary.
    for (let i = 0; i < 650; i++) {
      const x = rand() * 480, y = rand() < 0.5 ? 23 + rand() * 9 : 230 + rand() * 18;
      rect(c, x, y, 1 + Math.floor(rand() * 3), 2, i % 3 ? '#64734b' : '#a19658');
    }
    for (let i = 0; i < 90; i++) rect(c, rand() * 470, 95 + rand() * 140, 2, 1, '#b5a67b');
    poly(c, [215, 155, 232, 150, 248, 154, 235, 160, 220, 159], '#596d66');
    line(c, [222, 155, 237, 152, 243, 154], '#99a899');
    // Low wooden fence, distant verge and soft tree shadows stay in the ground layer.
    for (let x = 180; x < 312; x += 8) { rect(c, x, 36, 2, 20, '#7a7860'); rect(c, x, 36, 2, 2, '#b0a281'); }
    rect(c, 180, 42, 132, 2, '#9a9070'); rect(c, 180, 51, 132, 2, '#545e48');
    poly(c, [395, 181, 444, 169, 477, 193, 445, 210, 390, 199], '#53634a');
  });
  texture(scene, 'shop', 160, 80, c => building(c, true));
  texture(scene, 'house', 160, 80, c => building(c, false));
  texture(scene, 'van', 94, 57, van);
  texture(scene, 'chestnut', 120, 108, chestnut);
  for (const kind of ['jerzy', 'piotr', 'ochre', 'green', 'burgundy'] as PersonKind[])
    for (let frame = 0; frame < 3; frame++) texture(scene, `${kind}-${frame}`, 30, 32, c => person(c, kind, frame));
}
/** All sprites use feet/base as origin so y sorting stays independent of asset size. */
export function pixelSprite(scene: Phaser.Scene, x: number, y: number, key: string) {
  return scene.add.image(x, y, key).setOrigin(0.5, 1).setScale(2).setDepth(y);
}
