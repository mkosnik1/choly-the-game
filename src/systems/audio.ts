import type Phaser from 'phaser';
import type { Settings } from '../state/settings';
/** Future local music/effects go through this mixer. The current square has no audio assets. */
export class AudioMixer {
  private tracks: { sound: Phaser.Sound.BaseSound; channel: 'music' | 'effects' }[] = [];
  constructor(private game: Phaser.Game, private settings: Settings) {}
  apply(settings: Settings) {
    this.settings = settings;
    this.tracks = this.tracks.filter(t => !t.sound.pendingRemove);
    for (const track of this.tracks) {
      const sound = track.sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
      if (typeof sound.setVolume === 'function') sound.setVolume(settings[track.channel]);
    }
  }
  play(key: string, channel: 'music' | 'effects') {
    const sound = this.game.sound.add(key, { volume: this.settings[channel], loop: channel === 'music' });
    this.tracks.push({ sound, channel }); sound.play(); return sound;
  }
}
