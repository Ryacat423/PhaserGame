import Phaser from 'phaser';
import { FONTS } from '../../config/fonts';
import { LEVEL_2, LevelLayout } from '../../config/layouts';
import { onGameEvent } from '../../utils/events';
import { addSceneSound } from '../../utils/sound';
import { sheetScale } from '../../config/sprites';
import { sortOnce } from '../../utils/depth';
import { BaseLevel } from "./base_level";

export class Level2Scene extends BaseLevel {
    private isFireInvincible: boolean = false;
    private fireSprite!: Phaser.GameObjects.Sprite;
    private fireProximityZone!: Phaser.Physics.Arcade.Sprite;
    private fireCollisionZone!: Phaser.Physics.Arcade.Sprite;
    private fireCheckTimer!: Phaser.Time.TimerEvent;
    
    private firewoodSound!: Phaser.Sound.BaseSound;
    private catBurnedSound!: Phaser.Sound.BaseSound;
    private burnedSound!: Phaser.Sound.BaseSound;
    private isLevelCompleted: boolean = false;

    constructor() {
        super('level2');
    }

    protected override getLayout(): LevelLayout {
        return LEVEL_2;
    }

    protected override preloadLevelAssets(): void {
        this.load.image('snowman', 'assets/scene/levels/2/snowman.webp');
        this.load.image('ice', 'assets/scene/levels/2/slippery.webp');
    }

    protected getThemeAudioKey(): string {
        return 'level2_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/lvl-2-theme.mp3';
    }

    protected override getThemeVolume(): number {
        return 0.6;
    }

    protected getBackgroundTextureKey(): string {
        return 'level2_map';
    }

    protected override getLevelSpecificUIScenes(): string[] {
        return ['Level2UI'];
    }

    protected override createLevelSpecificElements(): void {
        this.resetFireMechanics();
        this.setupFireSounds();
        this.createSnowElements();
        this.setupFireMechanics();
        onGameEvent(this, 'levelCompleted', () => {
            this.onLevelComplete();
        });
    }

    private onLevelComplete(): void {
        this.isLevelCompleted = true;
        if (this.fireCheckTimer) {
            this.fireCheckTimer.destroy();
        }

        if (this.firewoodSound && this.firewoodSound.isPlaying) {
            this.firewoodSound.stop();
        }
    }

    private resetFireMechanics(): void {
        this.isFireInvincible = false;
        if (this.fireProximityZone) {
            this.fireProximityZone.destroy();
        }
        if (this.fireCollisionZone) {
            this.fireCollisionZone.destroy();
        }
        if (this.fireCheckTimer) {
            this.fireCheckTimer.destroy();
        }
    }

    private setupFireSounds(): void {
        this.firewoodSound = addSceneSound(this, 'firewood', { volume: 0.8 });
        this.catBurnedSound = addSceneSound(this, 'cat_burned', { volume: 0.7 });
        this.burnedSound = addSceneSound(this, 'burned', { volume: 0.9 });
    }

    private createSnowElements(): void {
        this.add.sprite(0, 0, 'snow')
            .setOrigin(0)
            .setScale(sheetScale('snow', 1))
            .play('blow')
            .setDepth(0);

        // Snowmen used to be static physics images with no collider, so the cat walked through them.
        LEVEL_2.snowmen.forEach(({ x, y, flip }) => {
            const snowman = this.add.image(x, y, 'snowman').setOrigin(0).setScale(0.8).setFlipX(flip ?? false);
            this.addSolidProp(snowman, [0.22, 0.6, 0.56, 0.38]);
        });

        const { x, y } = LEVEL_2.fire;
        this.fireSprite = this.add.sprite(x, y, 'fire')
            .play('sway')
            .setScale(sheetScale('fire', 0.12));
        sortOnce(this.fireSprite);
    }

    private setupFireMechanics(): void {
        const { x, y } = LEVEL_2.fire;
        this.fireProximityZone = this.physics.add.sprite(x, y, '')
            .setSize(140, 140)
            .setVisible(false);
        (this.fireProximityZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);

        this.fireCollisionZone = this.physics.add.sprite(x, y, '')
            .setSize(50, 50)
            .setVisible(false);
        (this.fireCollisionZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        
        this.physics.add.overlap(this.player, this.fireProximityZone, () => {
            this.handleFireProximity(true);
        });

        this.physics.add.overlap(this.player, this.fireCollisionZone, () => {
            this.handleFireCollision();
        });

        this.fireCheckTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.player || !this.fireSprite) return;
                
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    this.fireSprite.x, this.fireSprite.y
                );
                
                if (distance > 70) {
                    this.handleFireProximity(false);
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    private handleFireProximity(isNear: boolean): void {
        if (this.isLevelCompleted) return; 
        const level2UI = this.scene.get('Level2UI');
        if (level2UI && typeof (level2UI as any).setPlayerNearFire === 'function') {
            (level2UI as any).setPlayerNearFire(isNear);
            if (isNear && this.firewoodSound && !this.firewoodSound.isPlaying) {
                this.firewoodSound.play();
            }
        }
    }

    private handleFireCollision(): void {
        if (this.isLevelCompleted || this.isFireInvincible) return;

        this.isFireInvincible = true;
        const level2UI = this.scene.get('Level2UI');
        if (level2UI && typeof (level2UI as any).triggerFireDamage === 'function') {
            (level2UI as any).triggerFireDamage();
        }
        if (this.burnedSound) {
            this.burnedSound.play();
        }
        this.time.delayedCall(200, () => {
            if (this.catBurnedSound) {
                this.catBurnedSound.play();
            }
        });

        this.cameras.main.shake(200, 0.01);

        const damageText = this.add.text(this.player.x, this.player.y - 30, 'OUCH!', {
            fontSize: '16px',
            color: '#ff4444',
            fontFamily: FONTS.display,
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(10);

        this.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });

        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: 5,
            duration: 100
        });

        this.time.delayedCall(1000, () => {
            this.isFireInvincible = false;
        });
    }

    protected override cleanupLevelSpecific(): void {
        this.isLevelCompleted = false;
        this.resetFireMechanics();
    }

    protected override cleanupBeforeExit(): void {
        super.cleanupBeforeExit();
        
        if (this.firewoodSound) {
            this.firewoodSound.stop();
            this.firewoodSound.destroy();
        }
        if (this.catBurnedSound) {
            this.catBurnedSound.stop();
            this.catBurnedSound.destroy();
        }
        if (this.burnedSound) {
            this.burnedSound.stop();
            this.burnedSound.destroy();
        }
    }
}