import Phaser from 'phaser';
import { SquareScene } from './scenes/SquareScene';
import { square } from './data/square';
import { MenuController } from './ui/menu';
import { SettingsStore } from './state/settings';
import { AudioMixer } from './systems/audio';

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

const settings = new SettingsStore();
export const audio = new AudioMixer(game, settings.value);
settings.onChange = value => { audio.apply(value); (game.scene.getScene('Square') as SquareScene | null)?.applySettings(); };
let menus: MenuController;
game.events.on('square-ready', (scene: SquareScene) => {
  if (!menus) menus = new MenuController(game, settings, scene);
  else menus.bind(scene);
});
