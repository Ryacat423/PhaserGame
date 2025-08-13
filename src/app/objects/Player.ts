export class Player extends Phaser.Physics.Arcade.Sprite {
  cursor: any;
  hideKey: Phaser.Input.Keyboard.Key;

  moveSound!: Phaser.Sound.BaseSound;
  hurtSound!: Phaser.Sound.BaseSound;

  private isHiding: boolean = false;
  private baseSpeed: number = 70;
  private currentSpeed: number = 70;
  private isPoisoned: boolean = false;
  private poisonTimer: number = 0;
  private poisonDuration: number = 5000;
  private invulnerable: boolean = false;
  private invulnerabilityDuration: number = 1000;

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

    this.hideKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.setScale(0.15);
    this.setCollideWorldBounds(true);
    this.body?.setSize(220, 220);
    this.body?.setOffset(110, 180);
    this.setDepth(1);

    this.moveSound = scene.sound.add('footsteps');
    this.hurtSound = scene.sound.add('hurt');
  }

  public setHiding(hiding: boolean): void {
    this.isHiding = hiding;
  }

  public getIsHiding(): boolean {
    return this.isHiding;
  }

  public takeDamage(): void {
    if (this.invulnerable) return;
    this.invulnerable = true;
    this.setTint(0xff6666);
    this.hurtSound.play();
    this.scene.events.emit('playerHitByDog');
    
    this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
      this.invulnerable = false;
      if (!this.isPoisoned) {
        this.clearTint();
      } else {
        this.setTint(0xaa44aa);
      }
    });
  }

  public applyPoison(): void {
    if (this.isPoisoned) return;
    
    this.isPoisoned = true;
    this.poisonTimer = this.poisonDuration;
    
    this.currentSpeed = this.baseSpeed * 0.5;
    
    this.setTint(0xaa44aa);
  }

  private updatePoisonEffect(delta: number): void {
    if (!this.isPoisoned) return;
    
    this.poisonTimer -= delta;
    
    if (this.poisonTimer <= 0) {
      this.curePoison();
    }
  }

  private curePoison(): void {
    if (!this.isPoisoned) return;
    
    this.isPoisoned = false;
    this.poisonTimer = 0;
    this.currentSpeed = this.baseSpeed;
    if (!this.invulnerable) {
      this.clearTint();
    }
    
    console.log('Poison cured! Speed restored.');
  }

  public getIsPoisoned(): boolean {
    return this.isPoisoned;
  }

  public getIsInvulnerable(): boolean {
    return this.invulnerable;
  }

  override update(time?: number, delta?: number) {
    if (!this.active) return;
    if (delta) {
      this.updatePoisonEffect(delta);
    }

    if (this.isHiding || (this.body && !this.body.enable)) {
      if (this.body) {
        this.disableBody(false, false);
      }
      this.setVelocity(0, 0);
      return;
    }

    let x = 0;
    let y = 0;

    const { w, a, s, d } = this.cursor;
    const buttonPressed = w.isDown || a.isDown || s.isDown || d.isDown;

    if (!buttonPressed) {
      if (this.anims.currentAnim?.key !== 'cat_idle') {
        this.play('cat_idle');
      }

      if (this.moveSound && this.moveSound.isPlaying) {
        this.moveSound.stop();
      }
      this.setVelocity(0, 0);
    } else {
      if (!this.moveSound.isPlaying) {
        this.moveSound.play({ loop: true });
      }

      if(this.isHiding) {
        this.moveSound.pause();
      } else {
        this.moveSound.resume();
      }
        
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

      this.setVelocity(this.currentSpeed * x, this.currentSpeed * y);
    }
  }
}