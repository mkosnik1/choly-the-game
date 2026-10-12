import type Phaser from 'phaser';
/** Scene timer pauses together with exploration; no wall-clock catch-up after a pause. */
export class TextReveal {
  private timer?: Phaser.Time.TimerEvent;
  private characters: string[] = [];
  private count = 0;
  private speed = -1;
  constructor(private scene: Phaser.Scene, private target: Phaser.GameObjects.Text) {}
  get visibleCount() { return this.count; }
  show(text: string, speed: number, revealed = 0) {
    this.destroy(); this.characters = Array.from(text); this.count = Math.min(revealed, this.characters.length); this.speed = -1;
    this.target.setText(this.characters.slice(0, this.count).join('')); this.setSpeed(speed);
  }
  setSpeed(speed: number) {
    if (speed === this.speed) return;
    this.speed = speed; this.timer?.remove(); this.timer = undefined;
    if (!speed) { this.finish(); return; }
    if (this.count < this.characters.length) this.timer = this.scene.time.addEvent({ delay: 1000 / speed, repeat: this.characters.length - this.count - 1, callback: () => this.target.setText(this.characters.slice(0, ++this.count).join('')) });
  }
  finish() { this.timer?.remove(); this.timer = undefined; this.count = this.characters.length; this.target.setText(this.characters.join('')); }
  destroy() { this.timer?.remove(); this.timer = undefined; }
}
