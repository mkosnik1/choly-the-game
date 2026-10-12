import { SquareScene } from './SquareScene';
import { pixelSprite } from '../art/pixelArt';

/** Original procedural cabin. Scrolling view and gentle shake convey a moving Żuk. */
export class ArrivalScene extends SquareScene {
  private gate!: Phaser.GameObjects.Graphics;
  private road!: Phaser.GameObjects.TileSprite;
  constructor() { super('Arrival'); }
  protected createWorld() {
    if (!this.textures.exists('arrival-road')) {
      const texture = this.textures.createCanvas('arrival-road', 320, 130)!;
      const c = texture.getContext();
      c.fillStyle = '#839482'; c.fillRect(0, 0, 320, 130);
      c.fillStyle = '#65795b'; c.fillRect(0, 35, 320, 80);
      for (let i = 0; i < 18; i++) { const x = i * 21; c.fillStyle = i % 2 ? '#465b42' : '#536b49'; c.fillRect(x, 12 + i % 3 * 5, 16, 65); c.fillStyle = '#645a44'; c.fillRect(x + 6, 61, 3, 35); }
      c.fillStyle = '#647052'; c.fillRect(0, 104, 320, 26);
      texture.refresh(); texture.setFilter(1);
    }
    this.add.rectangle(480, 270, 960, 540, 0x303b33).setDepth(-3);
    this.road = this.add.tileSprite(480, 150, 680, 210, 'arrival-road').setDepth(-2);
    this.gate = this.add.graphics().setDepth(-1).setVisible(false);
    this.gate.fillStyle(0x888b73); this.gate.fillRect(344, 119, 9, 117); this.gate.fillRect(594, 119, 9, 117);
    this.gate.fillStyle(0x987c58); this.gate.fillRect(442, 222, 66, 18); this.gate.fillStyle(0x3c4e39); this.gate.fillRect(449, 220, 52, 5);
    const frame = this.add.graphics().setDepth(-1);
    frame.fillStyle(0x929078); frame.fillPoints([{ x: 450, y: 138 }, { x: 510, y: 138 }, { x: 775, y: 256 }, { x: 185, y: 256 }], true);
    frame.lineStyle(3, 0xc6b998); frame.lineBetween(480, 155, 480, 169); frame.lineBetween(480, 193, 480, 220);
    frame.fillStyle(0x354943); frame.fillRect(0, 44, 140, 300); frame.fillRect(820, 44, 140, 300);
    frame.fillStyle(0x657a69); frame.fillRect(132, 45, 12, 244); frame.fillRect(816, 45, 12, 244); frame.fillRect(136, 256, 688, 14);
    frame.fillStyle(0x253c34); frame.fillRect(0, 272, 960, 224);
    frame.fillStyle(0x7b8973); frame.fillRect(122, 282, 708, 10);
    frame.fillStyle(0x4f6152); frame.fillRect(450, 46, 16, 222);
    frame.fillStyle(0x182c27); frame.fillRoundedRect(160, 292, 640, 52, 8);
    frame.lineStyle(8, 0x9a8f6e); frame.strokeCircle(300, 318, 57); frame.lineBetween(251, 308, 349, 334); frame.lineBetween(300, 318, 300, 371);
    frame.fillStyle(0xb9b087); frame.fillCircle(475, 310, 12); frame.fillCircle(509, 310, 12);
    frame.fillStyle(0x534e38); frame.fillRect(65, 277, 72, 168); frame.fillRect(835, 277, 72, 168);
    pixelSprite(this, 214, 261, 'ochre-0').setScale(4).setDepth(2);
    pixelSprite(this, 749, 257, 'jerzy-0').setScale(4).setDepth(2);
    const driver = this.add.zone(214, 240, 160, 170).setInteractive({ useHandCursor: true }).setDepth(3);
    driver.on('pointerdown', () => this.resumeConversation('andrzej'));
    const name = this.add.text(48, 64, 'ANDRZEJ · kliknij, aby wrócić do rozmowy', { fontFamily: 'monospace', fontSize: '14px', color: '#f1ddae', backgroundColor: '#273d30', padding: { x: 8, y: 4 } }).setDepth(800).setInteractive({ useHandCursor: true });
    name.on('pointerdown', () => this.resumeConversation('andrzej'));
    driver.on('pointerover', () => name.setColor('#fff2b8')); driver.on('pointerout', () => name.setColor('#f1ddae'));
  }
  update(time: number, delta: number) {
    super.update(time, delta);
    const node = this.session.state.story.nodeId;
    this.gate?.setVisible(node === 'drive_end' || node === 'village_enter');
    if (this.road && node !== 'village_enter') { this.road.tilePositionX += Math.min(delta, 100) * 0.025; this.road.y = 150 + Math.sin(time / 150) * 1.5; }
  }
}
