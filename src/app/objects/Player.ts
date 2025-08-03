export class Player extends Phaser.Physics.Arcade.Sprite {
  cursor: any;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cat');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursor = scene.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.setScale(0.15)
    this.setCollideWorldBounds(true);
  }

  override update() {
    if (!this.active) return;

    const speed = 70;
    let x = 0;
    let y = 0;

    const { w, a, s, d } = this.cursor;
    const buttonPressed = w.isDown || a.isDown || s.isDown || d.isDown;

    if (!buttonPressed) {
      if (this.anims.currentAnim?.key !== 'cat_idle') {
        this.play('cat_idle');
      }
      this.setVelocity(0, 0);
    } else {
      if (this.anims.currentAnim?.key !== 'cat_walk') {
        this.play('cat_walk');
      }

      if (a.isDown) {
        x = -1;
        this.setFlipX(true);
      }

      if (d.isDown) {
        x = 1;
        this.setFlipX(false);
      }

      if (w.isDown) y = -1;
      if (s.isDown) y = 1;

      this.setVelocity(speed * x, speed * y);
    }
  }
}