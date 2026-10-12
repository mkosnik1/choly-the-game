import type Phaser from 'phaser';
import type { SquareScene } from '../scenes/SquareScene';
import { GameSession } from '../state/session';
import { SaveStore, type Save } from '../state/saves';
import { SettingsStore } from '../state/settings';
import { adjustAttribute, attributeInfo, presets, remainingPoints, validAttributes, type Attribute, type Attributes } from '../state/character';
import './menu.css';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
  const node = document.createElement(tag); node.textContent = text; return node;
}
function button(label: string, action: () => void, disabled = false) {
  const node = element('button', label); node.type = 'button'; node.disabled = disabled; node.addEventListener('click', action); return node;
}
export class MenuController {
  private root = element('section');
  private body!: HTMLDivElement;
  private scene!: SquareScene;
  private active = false;
  private mode = 'main';
  private attributes: Attributes = { Intelekt: 1, Psychika: 1, Percepcja: 1, Instynkt: 1 };
  readonly saves = new SaveStore();
  constructor(private game: Phaser.Game, readonly settings: SettingsStore, scene: SquareScene) {
    this.root.id = 'menu-root'; this.root.setAttribute('role', 'dialog'); this.root.setAttribute('aria-modal', 'true');
    document.body.append(this.root); this.bind(scene); this.main();
    window.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.repeat) return;
      event.preventDefault();
      if (!this.active) { if (this.mode !== 'main') this.main(); return; }
      if (this.root.hidden) this.pause(); else if (this.mode === 'pause') this.resume(); else this.pause();
    });
    this.root.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(this.root.querySelectorAll<HTMLElement>('button:not(:disabled),input,select'));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.root.querySelector('h1'))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  bind(scene: SquareScene) { this.scene = scene; if (!this.active) this.game.events.once('poststep', () => { if (!this.active) this.game.scene.pause('Square'); }); }
  private show(mode: string, title: string) {
    this.mode = mode; this.root.hidden = false;
    const panel = element('div'); panel.className = 'menu-panel';
    panel.append(element('p', 'PIEŚNI CHOŁÓW • PROTOTYP'));
    const heading = element('h1', title); heading.id = 'menu-title'; heading.tabIndex = -1;
    this.root.setAttribute('aria-labelledby', heading.id);
    this.body = element('div'); panel.append(heading, this.body); this.root.replaceChildren(panel); heading.focus();
  }
  private message(text: string) { const p = element('p', text); p.className = 'notice'; p.setAttribute('role', 'status'); this.body.append(p); }
  main() {
    this.active = false; this.game.scene.pause('Square'); this.show('main', 'Pieśni Chołów');
    this.body.append(element('p', 'Jerzy Drozd przybywa do Chołów. Pierwszy prototyp: plac wsi.'));
    if (this.saves.latest()) this.body.append(button('Kontynuuj', () => { const save = this.saves.latest(); if (save) this.load(save); }));
    this.body.append(button('Nowa gra', () => { this.attributes = { Intelekt: 1, Psychika: 1, Percepcja: 1, Instynkt: 1 }; this.creator(); }), button('Wczytaj grę', () => this.slots(false)), button('Ustawienia', () => this.settingsScreen(() => this.main())));
    const errors = this.saves.slots().filter(slot => slot.status === 'error');
    if (errors.length) this.message('Niektórych zapisów nie można odczytać. Szczegóły w „Wczytaj grę”; zapisy nie zostały usunięte.');
  }
  private creator() {
    this.show('creator', 'Jerzy Drozd — tworzenie postaci');
    this.body.append(element('p', 'Rozdziel 12 punktów. Każdy atrybut: 1–6. Build zostaje ustalony po rozpoczęciu gry.'));
    const profile = element('div'); profile.className = 'presets';
    for (const [name, build] of Object.entries(presets)) profile.append(button(name, () => { this.attributes = { ...build }; this.creator(); }));
    this.body.append(profile);
    for (const [key, info] of Object.entries(attributeInfo) as [Attribute, typeof attributeInfo[Attribute]][]) {
      const row = element('section'); row.className = 'attribute-row';
      const description = element('div'); description.append(element('h2', key), element('p', info.description), element('small', `Umiejętności: ${info.skills}`));
      const controls = element('div'); controls.className = 'attribute-controls';
      const adjust = (change: -1 | 1) => { this.attributes = adjustAttribute(this.attributes, key, change); this.creator(); this.body.querySelector<HTMLElement>(`[aria-label="${change === 1 ? 'Zwiększ' : 'Zmniejsz'} ${key}"]`)?.focus(); };
      const minus = button('−', () => adjust(-1), this.attributes[key] === 1); minus.setAttribute('aria-label', `Zmniejsz ${key}`);
      const plus = button('+', () => adjust(1), this.attributes[key] === 6 || remainingPoints(this.attributes) === 0); plus.setAttribute('aria-label', `Zwiększ ${key}`);
      const value = element('output', String(this.attributes[key])); value.setAttribute('aria-label', `Wartość ${key}`);
      controls.append(minus, value, plus); row.append(description, controls); this.body.append(row);
    }
    const points = element('p', `Pozostałe punkty: ${remainingPoints(this.attributes)}`); points.setAttribute('role', 'status'); this.body.append(points);
    this.body.append(button('Rozpocznij grę', () => this.start(new GameSession(this.attributes)), !validAttributes(this.attributes)), button('Wróć', () => this.main()));
  }
  private start(session: GameSession) {
    this.active = true; this.root.hidden = true;
    this.game.scene.stop('Square');
    this.game.scene.start('Square', { session, settings: this.settings });
    void this.fullscreen(this.settings.value.fullscreen);
    (this.game.canvas as HTMLCanvasElement).focus();
  }
  private load(save: Save) { this.start(new GameSession(save.state.character.attributes, save.state)); }
  pause() { if (!this.active) return; this.game.scene.pause('Square'); this.show('pause', 'Pauza'); this.body.append(button('Wznów', () => this.resume()), button('Zapisz grę', () => this.slots(true)), button('Ustawienia', () => this.settingsScreen(() => this.pause())), button('Menu główne', () => this.confirm('Opuścić bieżącą grę?', 'Niezapisany postęp zostanie utracony. Istniejące sloty pozostaną zachowane.', () => this.main(), () => this.pause()))); }
  private resume() { this.root.hidden = true; this.game.scene.resume('Square'); this.game.canvas.focus(); }
  private confirm(title: string, text: string, yes: () => void, no: () => void) {
    this.show('confirm', title); this.body.append(element('p', text), button('Potwierdź', yes), button('Anuluj', no));
  }
  private slots(saving: boolean) {
    this.show('slots', saving ? 'Zapisz grę' : 'Wczytaj grę');
    for (const slot of this.saves.slots()) {
      const row = element('section'); row.className = 'save-slot'; row.append(element('h2', `Slot ${slot.index}`));
      if (slot.status === 'valid') {
        const build = slot.save.state.character.attributes;
        row.append(element('p', `Plac Chołów • ${new Date(slot.save.savedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })} • ${Object.values(build).join('/')}`));
      } else row.append(element('p', slot.status === 'empty' ? 'Pusty slot' : slot.message));
      row.append(button(saving ? `Zapisz w slocie ${slot.index}` : `Wczytaj slot ${slot.index}`, () => {
        if (!saving) { if (slot.status === 'valid') this.load(slot.save); return; }
        const write = (confirmed = false) => {
          try {
            const outcome = this.saves.write(slot.index, this.scene.snapshot(), confirmed);
            if (outcome === 'confirm') this.confirm('Nadpisać zapis?', `Zastąpisz zawartość slotu ${slot.index}. Pozostałe sloty nie zmienią się.`, () => write(true), () => this.slots(true));
            else { this.slots(true); this.message(`Zapisano grę w slocie ${slot.index}.`); }
          } catch { this.message('Nie udało się zapisać gry. Sprawdź dostępność i wolne miejsce pamięci przeglądarki. Dotychczasowy zapis nie został celowo usunięty.'); }
        };
        write();
      }, !saving && slot.status !== 'valid'));
      this.body.append(row);
    }
    this.body.append(button('Wróć', () => this.active ? this.pause() : this.main()));
  }
  private settingsScreen(back: () => void) {
    this.show('settings', 'Ustawienia');
    for (const [key, title] of [['music', 'Głośność muzyki'], ['effects', 'Głośność efektów']] as const) {
      const label = element('label', title), input = element('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '1'; input.value = String(Math.round(this.settings.value[key] * 100));
      input.setAttribute('aria-label', title); const output = element('output', `${input.value}%`);
      input.addEventListener('input', () => { output.textContent = `${input.value}%`; this.settings.set({ [key]: Number(input.value) / 100 }); this.settingsNotice(); });
      label.append(input, output); this.body.append(label);
    }
    const label = element('label', 'Szybkość wyświetlania dialogów'), select = element('select'); select.setAttribute('aria-label', 'Szybkość wyświetlania dialogów');
    for (const [value, text] of [[0, 'Natychmiast'], [15, 'Wolno'], [35, 'Normalnie'], [70, 'Szybko']] as const) { const option = element('option', text); option.value = String(value); select.append(option); }
    select.value = String(this.settings.value.dialogueSpeed); select.addEventListener('change', () => { this.settings.set({ dialogueSpeed: Number(select.value) }); this.settingsNotice(); }); label.append(select); this.body.append(label);
    const full = element('label', 'Pełny ekran'), checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = this.settings.value.fullscreen; checkbox.setAttribute('aria-label', 'Pełny ekran');
    checkbox.addEventListener('change', async () => { this.settings.set({ fullscreen: checkbox.checked }); if (!(await this.fullscreen(checkbox.checked))) { this.settings.set({ fullscreen: false }); checkbox.checked = false; this.message('Przeglądarka nie udostępniła pełnego ekranu.'); } this.settingsNotice(); }); full.append(checkbox); this.body.append(full);
    this.body.append(button('Wróć', back)); this.settingsNotice();
  }
  private settingsNotice() { if (this.settings.error && !this.body.querySelector('.notice')) this.message(this.settings.error); }
  private async fullscreen(enabled: boolean) {
    try { if (enabled && !document.fullscreenElement) await document.documentElement.requestFullscreen(); else if (!enabled && document.fullscreenElement) await document.exitFullscreen(); return true; }
    catch { return false; }
  }
}
