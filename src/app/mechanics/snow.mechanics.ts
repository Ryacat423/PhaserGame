export class SnowMechanic {
    private scene: Phaser.Scene;
    private player: any;
    private isFireInvincible: boolean = false;
    private fireSprite!: Phaser.GameObjects.Sprite;
    private fireProximityZone!: Phaser.Physics.Arcade.Sprite;
    private fireCollisionZone!: Phaser.Physics.Arcade.Sprite;
    private fireCheckTimer!: Phaser.Time.TimerEvent;

    private firewoodSound!: Phaser.Sound.BaseSound;
    private catBurned!: Phaser.Sound.BaseSound;
    private burned!: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, player: any) {
        this.scene = scene;
        this.player = player;
    }

    preload(): void {

        if (!this.scene.cache.audio.has('firewood')) {
            this.scene.load.audio('firewood', 'assets/global/audio/firewood.mp3');
            this.scene.load.audio('cat_burned', 'assets/global/audio/cat_burned.mp3');
            this.scene.load.audio('burned', 'assets/global/audio/burn.mp3');
        }
        
        this.scene.load.image('snowman', 'assets/scene/levels/2/snowman.png');
    }

    create(): void {
        this.setupSounds();
        this.createSnowElements();
        this.setupFireSystem();
    }

    private setupSounds(): void {
        this.firewoodSound = this.scene.sound.add('firewood', { volume: 0.8 });
        this.catBurned = this.scene.sound.add('cat_burned', { volume: 0.7 });
        this.burned = this.scene.sound.add('burned', { volume: 0.9 });
    }

    private createSnowElements(): void {
        this.scene.add.sprite(0, 0, 'snow').setOrigin(0).play('blow').setDepth(0);
        this.scene.add.image(0, 30, 'snowman').setOrigin(0).setDepth(0);
        this.scene.add.image(850, 450, 'snowman').setOrigin(0).setFlipX(true).setDepth(0);
        this.fireSprite = this.scene.add.sprite(500, 150, 'fire').play('sway').setScale(0.1);
    }

    private setupFireSystem(): void {
        this.fireProximityZone = this.scene.physics.add.sprite(500, 150, '')
            .setSize(120, 120).setVisible(false);
        (this.fireProximityZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        
        this.fireCollisionZone = this.scene.physics.add.sprite(500, 150, '')
            .setSize(40, 40).setVisible(false);
        (this.fireCollisionZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        
        this.scene.physics.add.overlap(this.player, this.fireProximityZone, () => {
            this.handleFireProximity(true);
        });

        this.scene.physics.add.overlap(this.player, this.fireCollisionZone, () => {
            this.handleFireCollision();
        });

        this.fireCheckTimer = this.scene.time.addEvent({
            delay: 100,
            callback: this.checkFireDistance,
            callbackScope: this,
            loop: true
        });
    }

    private checkFireDistance(): void {
        if (!this.player || !this.fireSprite) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.fireSprite.x, this.fireSprite.y
        );
        
        if (distance > 60) {
            this.handleFireProximity(false);
        }
    }

    private handleFireProximity(isNear: boolean): void {
        const ui = this.scene.scene.get('Level2UI');
        if (ui && typeof (ui as any).setPlayerNearFire === 'function') {
            (ui as any).setPlayerNearFire(isNear);
            if (isNear && !this.firewoodSound.isPlaying) {
                this.firewoodSound.play();
            }
        }
    }

    private handleFireCollision(): void {
        if (this.isFireInvincible) return;

        this.isFireInvincible = true;
        const ui = this.scene.scene.get('Level2UI');
        if (ui && typeof (ui as any).triggerFireDamage === 'function') {
            (ui as any).triggerFireDamage();
        }

        this.burned.play();
        this.scene.time.delayedCall(200, () => this.catBurned.play());

        this.scene.cameras.main.shake(200, 0.01);
        this.createDamageText();
        this.createDamageEffect();

        this.scene.time.delayedCall(1000, () => {
            this.isFireInvincible = false;
        });
    }

    private createDamageText(): void {
        const damageText = this.scene.add.text(this.player.x, this.player.y - 30, 'OUCH!', {
            fontSize: '16px',
            color: '#ff4444',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(10);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    private createDamageEffect(): void {
        this.scene.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: 5,
            duration: 100
        });
    }

    destroy(): void {
        if (this.fireCheckTimer) this.fireCheckTimer.destroy();
        if (this.fireProximityZone) this.fireProximityZone.destroy();
        if (this.fireCollisionZone) this.fireCollisionZone.destroy();
        
        if(this.burned) this.burned.destroy()
        if(this.firewoodSound) this.firewoodSound.destroy()
        if(this.catBurned) this.catBurned.destroy()
    }
}