import { isRecord } from './character';
import { browserStorage, type StorageLike } from './saves';
export type Settings = { music: number; effects: number; dialogueSpeed: number; fullscreen: boolean };
export const defaultSettings: Settings = { music: 0.5, effects: 0.7, dialogueSpeed: 0, fullscreen: false };
export function validSettings(value: unknown): value is Settings {
  return isRecord(value) && [value.music, value.effects].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) && [0, 15, 35, 70].includes(Number(value.dialogueSpeed)) && typeof value.dialogueSpeed === 'number' && typeof value.fullscreen === 'boolean';
}
export class SettingsStore {
  private current = { ...defaultSettings };
  error = '';
  onChange?: (settings: Settings) => void;
  constructor(private storage: StorageLike = browserStorage) {
    try { const raw = storage.getItem('choly.settings'); if (raw) { const value = JSON.parse(raw); if (validSettings(value)) this.current = value; else this.error = 'Nieprawidłowe ustawienia — użyto domyślnych.'; } }
    catch { this.error = 'Nie można odczytać ustawień — użyto domyślnych.'; }
  }
  get value(): Settings { return { ...this.current }; }
  set(change: Partial<Settings>) {
    const next = { ...this.current, ...change };
    if (!validSettings(next)) throw new Error('Nieprawidłowe ustawienia.');
    this.current = next; this.error = ''; this.onChange?.(this.value);
    try { this.storage.setItem('choly.settings', JSON.stringify(next)); }
    catch { this.error = 'Nie udało się zachować ustawień w tej przeglądarce.'; }
  }
}
