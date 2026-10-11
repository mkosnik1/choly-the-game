import Phaser from 'phaser';
import { SquareScene } from './scenes/SquareScene';
import { square } from './data/square';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: square.width,
  height: square.height,
  backgroundColor: '#202e26',
  pixelArt: true,
  roundPixels: true,
  scene: [SquareScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
});
