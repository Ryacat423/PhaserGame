import Phaser from 'phaser';
import { prefersTouchControls, touchInput } from '../../input/touchInput';

const STICK_X = 110;
const STICK_Y = 480;
const STICK_RADIUS = 60;
const KNOB_RADIUS = 28;
/** Joystick input below this fraction of the radius is ignored. */
const DEAD_ZONE = 0.2;

/**
 * On-screen joystick plus Jump and Sprint buttons for touch devices. Runs on top of a level and
 * writes to `touchInput`. Hiding uses the hide button GameUI already draws bottom-right.
 */
export class TouchControls extends Phaser.Scene {
  private knob!: Phaser.GameObjects.Arc;
  private stickPointerId: number | null = null;

  constructor() {
    super({ key: 'TouchControls' });
  }

  create(): void {
    touchInput.reset();
    this.stickPointerId = null;

    this.createJoystick();
    this.createButton(830, 545, 'JUMP', (down) => (touchInput.jump = down));
    this.createButton(940, 440, 'RUN', (down) => (touchInput.sprint = down));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => touchInput.reset());
  }

  private createJoystick(): void {
    this.add.circle(STICK_X, STICK_Y, STICK_RADIUS, 0x000000, 0.25)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.knob = this.add.circle(STICK_X, STICK_Y, KNOB_RADIUS, 0xffffff, 0.55)
      .setScrollFactor(0)
      .setDepth(1001);

    // A generous zone around the stick, so a thumb that lands slightly off still grabs it.
    const zone = this.add.zone(STICK_X, STICK_Y, STICK_RADIUS * 3.2, STICK_RADIUS * 3.2)
      .setScrollFactor(0)
      .setInteractive();

    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.stickPointerId = p.id;
      this.moveStick(p);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.stickPointerId) this.moveStick(p);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stickPointerId) return;
      this.stickPointerId = null;
      this.knob.setPosition(STICK_X, STICK_Y);
      touchInput.x = 0;
      touchInput.y = 0;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  private moveStick(p: Phaser.Input.Pointer): void {
    const dx = p.x - STICK_X;
    const dy = p.y - STICK_Y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, STICK_RADIUS);
    const nx = dist ? dx / dist : 0;
    const ny = dist ? dy / dist : 0;

    this.knob.setPosition(STICK_X + nx * clamped, STICK_Y + ny * clamped);

    const strength = clamped / STICK_RADIUS;
    if (strength < DEAD_ZONE) {
      touchInput.x = 0;
      touchInput.y = 0;
    } else {
      touchInput.x = nx * strength;
      touchInput.y = ny * strength;
    }
  }

  private createButton(x: number, y: number, label: string, onChange: (down: boolean) => void): void {
    const button = this.add.circle(x, y, 40, 0x000000, 0.3)
      .setStrokeStyle(3, 0xffffff, 0.6)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();
    this.add.text(x, y, label, {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    let pointerId: number | null = null;
    button.on('pointerdown', (p: Phaser.Input.Pointer) => {
      pointerId = p.id;
      button.setFillStyle(0xffffff, 0.35);
      onChange(true);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== pointerId) return;
      pointerId = null;
      button.setFillStyle(0x000000, 0.3);
      onChange(false);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }
}

/** Shows touch controls over `scene` on touch devices, until that scene shuts down. */
export function attachTouchControls(scene: Phaser.Scene): void {
  if (!prefersTouchControls()) return;
  if (!scene.scene.isActive('TouchControls')) scene.scene.launch('TouchControls');
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scene.stop('TouchControls'));
}
