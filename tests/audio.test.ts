import { it, expect, vi } from 'vitest';
import { AudioMixer } from '../src/systems/audio';
import { defaultSettings } from '../src/state/settings';
it('routes music and effect volumes independently and reapplies settings to playing tracks', () => {
  const music = { pendingRemove: false, play: vi.fn(), setVolume: vi.fn() };
  const effect = { pendingRemove: false, play: vi.fn(), setVolume: vi.fn() };
  const add = vi.fn().mockReturnValueOnce(music).mockReturnValueOnce(effect);
  const mixer = new AudioMixer({ sound: { add } } as any, defaultSettings);
  mixer.play('theme', 'music'); mixer.play('step', 'effects');
  expect(add).toHaveBeenNthCalledWith(1, 'theme', { volume: 0.5, loop: true });
  expect(add).toHaveBeenNthCalledWith(2, 'step', { volume: 0.7, loop: false });
  expect(music.play).toHaveBeenCalledOnce(); expect(effect.play).toHaveBeenCalledOnce();
  mixer.apply({ ...defaultSettings, music: 0, effects: 0.25 });
  expect(music.setVolume).toHaveBeenLastCalledWith(0); expect(effect.setVolume).toHaveBeenLastCalledWith(0.25);
  effect.pendingRemove = true; effect.setVolume.mockClear(); mixer.apply(defaultSettings);
  expect(effect.setVolume).not.toHaveBeenCalled();
});
