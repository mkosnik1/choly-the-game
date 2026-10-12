import Phaser from 'phaser';
import { story } from '../content/story';
import { bonus } from '../rpg';
import { GameSession } from '../state/session';
import { presets } from '../state/character';
import { SettingsStore } from '../state/settings';
import { DialogueController } from '../systems/dialogue';
import { TextReveal } from '../systems/textReveal';
import { findPath, type Point } from '../navigation';
import { square } from '../data/square';
import { createSquareTextures, pixelSprite } from '../art/pixelArt';

const hint = 'Kliknij teren, aby iść  •  Piotr: rozmowa  •  [K] karta postaci';

/** Exploration orchestration for scene 002. Art, map layout and story data are separate. */
export class SquareScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private path: Point[] = [];
  private talkPending = false;
  protected session!: GameSession;
  protected settings!: SettingsStore;
  private dialogueController!: DialogueController;
  private isTransition = false;
  private reveal?: TextReveal;
  private dialog?: Phaser.GameObjects.Container;
  private note!: Phaser.GameObjects.Text;
  private destination!: Phaser.GameObjects.Graphics;
  private piotr!: Phaser.GameObjects.Container;
  private hoverRing!: Phaser.GameObjects.Ellipse;
  private piotrSprite!: Phaser.GameObjects.Image;

  constructor(key = 'Square') { super(key); }

  init(data: { session?: GameSession; settings?: SettingsStore; transition?: boolean } = {}) {
    this.session = data.session ?? new GameSession(presets.Psycholog);
    this.settings = data.settings ?? new SettingsStore();
    this.dialogueController = new DialogueController(this.session);
    this.path = structuredClone(this.session.state.movement.path);
    this.talkPending = this.session.state.movement.talkPending;
    this.dialog = undefined;
    this.isTransition = !!data.transition;
  }

  applySettings() { this.reveal?.setSpeed(this.settings.value.dialogueSpeed); }

  snapshot() {
    this.session.update({ dialogue: this.session.state.dialogue ? { ...this.session.state.dialogue, revealed: this.reveal?.visibleCount ?? this.session.state.dialogue.revealed } : null, position: { x: this.player.x, y: this.player.y }, movement: { path: this.path, talkPending: this.talkPending, flipX: this.playerSprite.flipX } });
    return this.session.snapshot();
  }

  create() {
    createSquareTextures(this);
    this.createWorld();
    this.destination = this.add.graphics().setDepth(0).setVisible(false);
    this.destination.lineStyle(2, 0xe1c689).strokePoints([
      { x: 0, y: -7 }, { x: 13, y: 0 }, { x: 0, y: 7 }, { x: -13, y: 0 }
    ], true);
    this.playerSprite = this.add.image(0, 0, 'jerzy-0').setOrigin(0.5, 1).setScale(2);
    this.player = this.add.container(this.session.state.position.x, this.session.state.position.y, [this.playerSprite]).setDepth(this.session.state.position.y).setName('jerzy');
    this.player.setData('moving', false);
    this.player.setVisible(this.sys.settings.key === 'Square');
    this.playerSprite.setFlipX(this.session.state.movement.flipX);

    if (this.sys.settings.key === 'Square') this.createPiotr();
    this.createHud();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]) => {
      if (this.sys.settings.key !== 'Square' || this.dialog || objects.length || pointer.worldY < square.bounds.top || pointer.worldY > square.bounds.bottom) return;
      this.talkPending = false;
      const path = findPath(this.player, { x: pointer.worldX, y: pointer.worldY });
      if (path.length) {
        this.path = path;
        this.setDestination(path[path.length - 1]);
        this.note.setText(hint);
      } else this.note.setText('Nie można tam wejść. Wybierz wolny fragment placu.');
    });
    this.input.keyboard?.on('keydown-K', () => this.toggleCharacter());
    this.input.keyboard?.on('keydown-J', () => this.toggleJournal());
    this.events.once('shutdown', () => { this.reveal?.destroy(); this.reveal = undefined; });
    if (this.path.length) this.setDestination(this.path[this.path.length - 1]);
    if (this.session.state.dialogue) this.showCurrentDialogue();
    else if (this.session.state.cardOpen) this.toggleCharacter();
    else if (this.session.state.journalOpen) this.toggleJournal();
    if (this.isTransition) this.cameras.main.fadeIn(350);
    if (this.session.state.story.nodeId === 'explore') {
      const cue = this.add.text(480, 250, story.nodes.explore.text, { fontFamily: 'Georgia', fontSize: '17px', color: '#efe5d4', backgroundColor: '#24372c', padding: { x: 16, y: 12 }, wordWrap: { width: 570 } }).setOrigin(0.5).setDepth(850);
      this.tweens.add({ targets: cue, alpha: 0, delay: 3500, duration: 800, onComplete: () => cue.destroy() });
    }
    this.game.events.emit('gameplay-ready', this);
  }

  protected createWorld() {
    this.add.image(0, 0, 'square-ground').setOrigin(0).setScale(2).setDepth(-1);
    for (const prop of square.props) pixelSprite(this, prop.x, prop.y, prop.texture).setScale(prop.scale).setName(prop.id);
    // Signs are separate from artwork so lettering remains readable and localizable.
    this.add.text(91, 139, 'SŁODYCZE WINA', {
      fontFamily: 'monospace', fontSize: '16px', color: '#f0d5a3', backgroundColor: '#39392c', padding: { x: 5, y: 3 }
    }).setRotation(0.30).setDepth(203);
    this.add.text(148, 305, 'ŻUK', { fontFamily: 'monospace', fontSize: '11px', color: '#dfdcc1', backgroundColor: '#42564f', padding: { x: 4, y: 2 } }).setDepth(376);
    for (const villager of square.villagers) pixelSprite(this, villager.x, villager.y, `${villager.coat}-0`).setName('villager');

  }
  private createPiotr() {
    this.hoverRing = this.add.ellipse(0, -3, 58, 22, 0xe2c489, 0.13).setStrokeStyle(2, 0xe2c489, 0.75);
    this.piotrSprite = this.add.image(0, 0, 'piotr-0').setOrigin(0.5, 1).setScale(2);
    this.piotr = this.add.container(square.piotr.x, square.piotr.y, [this.hoverRing, this.piotrSprite]).setDepth(square.piotr.y).setName('piotr');
    this.piotr.setSize(64, 130).setInteractive({ useHandCursor: true });
    this.piotr.on('pointerover', () => { if (!this.dialog) this.setPiotrHover(true); });
    this.piotr.on('pointerout', () => this.setPiotrHover(false));
    this.piotr.on('pointerdown', () => {
      if (this.dialog) return;
      this.path = findPath(this.player, square.piotr.approach);
      if (!this.path.length) return;
      this.talkPending = true;
      this.setDestination(square.piotr.approach);
      this.note.setText('Jerzy podchodzi do Piotra Bieniasza…');
    });
    this.add.text(690, 220, 'PIOTR BIENIASZ', { fontFamily: 'monospace', fontSize: '13px', color: '#f1ddae', backgroundColor: '#303d32', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(800);
    const speech = this.add.text(720, 254, '…', { fontFamily: 'monospace', fontSize: '17px', color: '#29362d', backgroundColor: '#e3cb94', padding: { x: 4, y: 0 } }).setOrigin(0.5).setDepth(800);
    this.tweens.add({ targets: speech, y: 250, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  }
  protected resumeConversation(interaction: string) {
    if (this.dialog) return;
    this.dialogueController.start(interaction);
    if (this.session.state.dialogue) this.showCurrentDialogue();
  }
  private dismissPanel() {
    this.closeOverlay(); this.session.update({ cardOpen: false, journalOpen: false, dialogue: null });
    const node = story.nodes[this.session.state.story.nodeId];
    if (node.mode !== 'exploration' && !node.nextScene) this.resumeConversation(this.session.state.scene === 'Arrival' ? 'andrzej' : 'piotr_bieniasz');
  }
  private toggleJournal() {
    if (this.session.state.journalOpen && this.dialog) { this.dismissPanel(); return; }
    this.closeOverlay();
    this.path = []; this.talkPending = false; this.destination.setVisible(false);
    this.session.update({ journalOpen: true, cardOpen: false, dialogue: null });
    const entries = this.session.state.story.journal;
    this.openOverlay('DZIENNIK\n\n' + (entries.length ? entries.map(item => '• ' + item).join('\n\n') : 'Brak zapisanych obserwacji.'), [{ label: 'Zamknij', next: '' }], () => this.dismissPanel());
  }

  private createHud() {
    this.add.rectangle(480, 22, 960, 44, 0x202e26, 0.97).setDepth(900);
    this.add.rectangle(480, 44, 960, 2, 0x9e9870).setDepth(900);
    this.add.text(24, 10, 'PIEŚNI CHOŁÓW', { fontFamily: 'Georgia', fontSize: '23px', color: '#ebd6a7' }).setDepth(901);
    this.add.text(267, 16, this.sys.settings.key === 'Square' ? '002 / PLAC CHOŁÓW' : '001 / PODRÓŻ ŻUKIEM', { fontFamily: 'monospace', fontSize: '13px', color: '#aeb69a' }).setDepth(901);
    const card = this.add.text(810, 13, '[K] POSTAĆ', { fontFamily: 'monospace', fontSize: '14px', color: '#e2c894', padding: { x: 8, y: 2 } }).setDepth(901).setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setBackgroundColor('#4b5941'));
    card.on('pointerout', () => card.setBackgroundColor(''));
    card.on('pointerdown', () => this.toggleCharacter());
    const journal = this.add.text(640, 13, '[J] DZIENNIK', { fontFamily: 'monospace', fontSize: '14px', color: '#e2c894', padding: { x: 8, y: 2 } }).setDepth(901).setInteractive({ useHandCursor: true });
    journal.on('pointerdown', () => this.toggleJournal());
    journal.on('pointerover', () => journal.setBackgroundColor('#4b5941'));
    journal.on('pointerout', () => journal.setBackgroundColor(''));
    this.add.rectangle(480, 518, 960, 44, 0x202e26, 0.97).setDepth(900);
    this.add.rectangle(480, 496, 960, 2, 0x9e9870).setDepth(900);
    this.note = this.add.text(24, 510, this.sys.settings.key === 'Square' ? hint : 'Podróż z Andrzejem  •  [K] karta  •  [J] dziennik  •  Escape: pauza', { fontFamily: 'monospace', fontSize: '13px', color: '#d9d2b2' }).setDepth(901);
  }

  private setPiotrHover(hovered: boolean) {
    this.hoverRing.setFillStyle(0xf4dfa4, hovered ? 0.4 : 0.13).setStrokeStyle(hovered ? 3 : 2, hovered ? 0xffedbb : 0xe2c489, hovered ? 1 : 0.75);
    if (hovered) this.piotrSprite.setTint(0xffe1a0); else this.piotrSprite.clearTint();
    this.piotr.setData('hovered', hovered);
    if (!this.dialog) this.note.setText(hovered ? 'Piotr Bieniasz  •  kliknij, aby podejść i porozmawiać' : hint);
  }

  private setDestination(point: Point) {
    this.destination.setPosition(point.x, point.y).setVisible(true);
  }

  update(time: number, delta: number) {
    let remaining = this.dialog ? 0 : 170 * Math.min(delta, 100) / 1000;
    const moving = !this.dialog && this.path.length > 0;
    if (moving) this.playerSprite.setFlipX(this.path[0].x < this.player.x);
    while (this.path.length && remaining > 0) {
      const target = this.path[0], dx = target.x - this.player.x, dy = target.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= remaining) {
        this.player.setPosition(target.x, target.y); this.path.shift(); remaining -= distance;
      } else {
        this.player.x += dx / distance * remaining; this.player.y += dy / distance * remaining; remaining = 0;
      }
    }
    const walking = moving && this.path.length > 0;
    this.player.setData('moving', walking);
    this.playerSprite.setTexture(`jerzy-${walking ? [1, 0, 2, 0][Math.floor(time / 125) % 4] : 0}`);
    this.player.setDepth(this.player.y);
    if (!this.path.length) this.destination.setVisible(false);
    if (!this.dialog && this.talkPending && !this.path.length) {
      this.talkPending = false; this.setPiotrHover(false); this.dialogueController.start('piotr_bieniasz'); this.showCurrentDialogue();
    }
    if (moving) this.snapshot();
  }

  private closeOverlay() { this.reveal?.destroy(); this.reveal = undefined; this.dialog?.destroy(); this.dialog = undefined; }

  private toggleCharacter() {
    if (this.session.state.cardOpen && this.dialog) { this.dismissPanel(); return; }
    this.closeOverlay();
    const character = this.session.state.character;
    const text = ['JERZY DROZD', ...Object.entries(character.attributes).map(([k, v]) => `${k}: ${v}`), '',
      ...Object.entries(character.skills).map(([k, v]) => `${k}: ${v} (premia ${bonus(k as keyof typeof character.skills, 0, character)})`)].join('\n');
    this.path = []; this.talkPending = false; this.destination.setVisible(false);
    this.session.update({ cardOpen: true, journalOpen: false, dialogue: null });
    this.openOverlay(text, [{ label: 'Zamknij', next: '' }], () => this.dismissPanel());
  }

  private openOverlay(text: string, choices: { label: string; next: string; color?: string }[], onChoice: (i: number) => void) {
    const card = text.startsWith('JERZY DROZD') || text.startsWith('DZIENNIK');
    const cabin = !card && this.sys.settings.key === 'Arrival';
    const shade = this.add.rectangle(480, 270, 960, 540, 0x131e18, cabin ? 0.18 : 0.5).setInteractive();
    const bg = this.add.rectangle(480, card ? 270 : cabin ? 399 : 310, 850, card ? 500 : cabin ? 250 : 420, 0x202e25, 0.99).setStrokeStyle(2, 0xc0aa77);
    const content = this.add.text(86, card ? 48 : cabin ? 285 : 115, text, {
      fontFamily: 'Georgia', fontSize: card || cabin ? '16px' : '17px', color: '#efe5d4', wordWrap: { width: cabin ? 480 : 780 }, lineSpacing: card ? 1 : cabin ? 2 : 4
    });
    this.dialog = this.add.container(0, 0, [shade, bg, content]).setDepth(1000);
    if (!card) { this.reveal = new TextReveal(this, content); this.reveal.show(text, this.settings.value.dialogueSpeed, this.session.state.dialogue?.revealed ?? 0); shade.on('pointerdown', () => this.reveal?.finish()); }
    let choiceY = cabin ? 285 : card ? 480 : 388;
    choices.forEach((choice, i) => {
      const t = this.add.text(cabin ? 596 : 94, choiceY, `${i + 1}. ${choice.label}`, {
        fontFamily: 'Georgia', fontSize: cabin ? '15px' : '17px', color: choice.color ?? '#e0d0a0', wordWrap: { width: cabin ? 290 : 755 }, padding: { x: 4, y: 0 }
      }).setName(`dialogue-choice-${i}`).setInteractive({ useHandCursor: true });
      choiceY += cabin ? t.height + 14 : 39;
      t.on('pointerover', () => t.setColor(choice.color ?? '#fff0ba').setBackgroundColor('#48523e'));
      t.on('pointerout', () => t.setColor(choice.color ?? '#e0d0a0').setBackgroundColor(''));
      t.on('pointerdown', () => onChoice(i)); this.dialog!.add(t);
    });
  }

  private showCurrentDialogue() {
    this.closeOverlay();
    const view = this.dialogueController.view();
    this.openOverlay(view.text, view.choices, index => {
      this.dialogueController.choose(index);
      if (this.session.state.scene !== this.sys.settings.key) { this.closeOverlay(); this.input.enabled = false; this.cameras.main.once('camerafadeoutcomplete', () => this.game.events.emit('chapter-transition', this.session)); this.cameras.main.fadeOut(350); return; }
      if (this.session.state.dialogue) this.showCurrentDialogue();
      else { this.closeOverlay(); this.note.setText('Rozmowa zakończona. Możesz dalej zwiedzać plac. [K] karta postaci.'); }
    });
  }
}
