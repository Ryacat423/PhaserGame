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
  
  private isCold: boolean = false;
  private coldShiverTimer: number = 0;
  private coldShiverInterval: number = 2000;
  
  private slowedText?: Phaser.GameObjects.Text;
  private slowedTextTween?: Phaser.Tweens.Tween;
  private coldText?: Phaser.GameObjects.Text;
  private coldTextTween?: Phaser.Tweens.Tween;

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
    this.setDepth(3);

    this.moveSound = scene.sound.add('footsteps');
    this.hurtSound = scene.sound.add('hurt');
  }

  private createSlowedText(): void {
    if (this.slowedText) {
      this.destroySlowedText();
    }
    this.slowedText = this.scene.add.text(0, 0, 'SLOWED', {
      fontSize: '12px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#880088',
      strokeThickness: 2,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 1,
        fill: true
      }
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: this.slowedText,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startSlowedTextPulse();
      }
    });

    this.scene.tweens.add({
      targets: this.slowedText,
      y: this.y - 60,
      duration: 300,
      ease: 'Power2.easeOut'
    });
  }

  private startSlowedTextPulse(): void {
    if (!this.slowedText) return;
    this.slowedTextTween = this.scene.tweens.add({
      targets: this.slowedText,
      scale: 1.1,
      alpha: 0.8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private updateSlowedTextPosition(): void {
    if (this.slowedText) {
      this.slowedText.x = this.x;
      this.slowedText.y = this.y - (this.anims.currentAnim?.key !== 'cat_idle' ? 30 : 50);
    }
  }

  private destroySlowedText(): void {
    if (this.slowedTextTween) {
      this.slowedTextTween.destroy();
      this.slowedTextTween = undefined;
    }

    if (this.slowedText) {
      this.scene.tweens.add({
        targets: this.slowedText,
        scale: 0,
        alpha: 0,
        y: this.slowedText.y - 20,
        duration: 250,
        ease: 'Back.easeIn',
        onComplete: () => {
          if (this.slowedText) {
            this.slowedText.destroy();
            this.slowedText = undefined;
          }
        }
      });
    }
    
    this.slowedText = undefined;
  }

  private createColdText(): void {
    if (this.coldText) {
      this.destroyColdText();
    }
    
    this.coldText = this.scene.add.text(0, 0, 'COLD', {
      fontSize: '12px',
      fontFamily: 'Arial Black, Arial',
      color: '#87CEEB',
      stroke: '#000080',
      strokeThickness: 2,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 1,
        fill: true
      }
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: this.coldText,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startColdTextPulse();
      }
    });

    this.scene.tweens.add({
      targets: this.coldText,
      y: this.y - (this.isPoisoned ? 80 : 60),
      duration: 300,
      ease: 'Power2.easeOut'
    });
  }

  private startColdTextPulse(): void {
    if (!this.coldText) return;
    this.coldTextTween = this.scene.tweens.add({
      targets: this.coldText,
      scale: 1.1,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private updateColdTextPosition(): void {
    if (this.coldText) {
      this.coldText.x = this.x;
      const baseY = this.y - (this.anims.currentAnim?.key !== 'cat_idle' ? 30 : 50);
      this.coldText.y = baseY - (this.isPoisoned ? 20 : 0);
    }
  }

  private destroyColdText(): void {
    if (this.coldTextTween) {
      this.coldTextTween.destroy();
      this.coldTextTween = undefined;
    }

    if (this.coldText) {
      this.scene.tweens.add({
        targets: this.coldText,
        scale: 0,
        alpha: 0,
        y: this.coldText.y - 20,
        duration: 250,
        ease: 'Back.easeIn',
        onComplete: () => {
          if (this.coldText) {
            this.coldText.destroy();
            this.coldText = undefined;
          }
        }
      });
    }
    
    this.coldText = undefined;
  }

  public showSlowedText(scene: Phaser.Scene, show: boolean = false): void {
    if (show) {
      this.createSlowedText();
    } else {
      this.destroySlowedText();
    }
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
      this.updateTint();
    });
  }

  public applyPoison(): void {
    if (this.isPoisoned) return;
    
    this.isPoisoned = true;
    this.poisonTimer = this.poisonDuration;
    
    this.currentSpeed = this.baseSpeed * 0.5;
  
    this.updateTint();
    this.showSlowedText(this.scene, true);
  }

  public applyCold(): void {
    if (this.isCold) return;
    
    this.isCold = true;
    this.coldShiverTimer = 0;
    
    this.currentSpeed = Math.min(this.currentSpeed, this.baseSpeed * 0.7);
    
    this.updateTint();
    this.createColdText();
  }

  public cureCold(): void {
    if (!this.isCold) return;
    
    this.isCold = false;
    this.coldShiverTimer = 0;

    if (this.isPoisoned) {
      this.currentSpeed = this.baseSpeed * 0.5;
    } else {
      this.currentSpeed = this.baseSpeed;
    }
    
    this.updateTint();
    this.destroyColdText();
  }

  private updateTint(): void {
    if (this.invulnerable) {
      this.setTint(0xff6666);
    } else if (this.isPoisoned && this.isCold) {
      this.setTint(0x8844aa);
    } else if (this.isPoisoned) {
      this.setTint(0xaa44aa);
    } else if (this.isCold) {
      this.setTint(0x4488cc);
    } else {
      this.clearTint();
    }
  }

  private updatePoisonEffect(delta: number): void {
    if (!this.isPoisoned) return;
    
    this.poisonTimer -= delta;
    if (this.poisonTimer <= 0) {
      this.curePoison();
    }
  }

  private updateColdEffect(delta: number): void {
    if (!this.isCold) return;
    
    this.coldShiverTimer += delta;
    if (this.coldShiverTimer >= this.coldShiverInterval) {
      this.coldShiverTimer = 0;
      this.performShiver();
    }
  }

  private performShiver(): void {
    const originalX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: originalX - 2,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power1',
      onComplete: () => {
        this.x = originalX;
      }
    });
  }

  private curePoison(): void {
    if (!this.isPoisoned) return;
    
    this.isPoisoned = false;
    this.poisonTimer = 0;

    if (this.isCold) {
      this.currentSpeed = this.baseSpeed * 0.7;
    } else {
      this.currentSpeed = this.baseSpeed;
    }
    
    this.showSlowedText(this.scene, false);
    this.updateTint();
  }

  public getIsPoisoned(): boolean {
    return this.isPoisoned;
  }

  public getIsCold(): boolean {
    return this.isCold;
  }

  public getIsInvulnerable(): boolean {
    return this.invulnerable;
  }

  override update(time?: number, delta?: number) {
    if (!this.active) return;
    
    if (delta) {
      this.updatePoisonEffect(delta);
      this.updateColdEffect(delta);
    }

    if (this.isPoisoned) {
      this.updateSlowedTextPosition();
    }
    
    if (this.isCold) {
      this.updateColdTextPosition();
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