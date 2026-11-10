import Phaser from 'phaser';
import { LEVEL_4, LevelLayout } from '../../config/layouts';
import { onGameEvent } from '../../utils/events';
import { addSceneSound } from '../../utils/sound';
import { BaseLevel } from "./base_level";

export class Level4Scene extends BaseLevel {
    private lightningWarning!: Phaser.GameObjects.Graphics;
    private lightningSprite!: Phaser.GameObjects.Sprite;
    private lightningTimer!: Phaser.Time.TimerEvent;
    private warningTimer!: Phaser.Time.TimerEvent;
    private isLightningActive: boolean = false;
    private lightningDamageDealt: boolean = false;
    private isLevelCompleted: boolean = false;

    private readonly LIGHTNING_DAMAGE = 3;
    private readonly WARNING_DURATION = 2000;
    private readonly LIGHTNING_INTERVAL = 8000; 
    private readonly WARNING_RADIUS = 60;
    private readonly STRIKE_RADIUS = 50;
    
    private warningSound!: Phaser.Sound.BaseSound;
    private lightningStrike!: Phaser.Sound.BaseSound;
    private rain!: Phaser.Sound.BaseSound;

    private warningPosition: { x: number, y: number } = { x: 0, y: 0 };
    
    // Mud mechanics
    private mudPuddles: Phaser.Physics.Arcade.Sprite[] = [];
    private mudGraphics!: Phaser.GameObjects.Graphics;
    private playerInMud: boolean = false;
    private mudSlowAmount: number = 0.5;

    constructor() {
        super('level4');
    }

    protected override getLayout(): LevelLayout {
        return LEVEL_4;
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('level4_theme', 'assets/global/audio/rain_theme.mp3');
        this.load.audio('rain', 'assets/global/audio/rain.mp3');
        this.load.audio('lightning_charge', 'assets/global/audio/lightning_start.mp3');
        this.load.audio('lightning_strike', 'assets/global/audio/lightning_strike.mp3');
    }

    protected override getLevelSpecificUIScenes(): string[] {
        return ['Level4UI'];
    }

    protected getThemeAudioKey(): string {
        return 'level4_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/rain_theme.mp3';
    }

    protected getBackgroundTextureKey(): string {
        return 'level3_map';
    }

    protected override getThemeVolume(): number {
        return 1;
    }

    protected override createLevelSpecificElements(): void {
        this.setupSounds();
        this.createMudPuddles();
        this.createRain();
        this.setupLightningSystem();
        this.startLightningCycle();

        onGameEvent(this, 'levelCompleted', () => {
            this.onLevelComplete();
        });
    }

    private createMudPuddles(): void {
        this.mudGraphics = this.add.graphics();
        
        const mudPositions = LEVEL_4.mud;

        mudPositions.forEach((mud, index) => {
            this.drawMudPuddle(mud.x, mud.y, mud.width, mud.height);
            
            const mudZone = this.physics.add.sprite(mud.x, mud.y, '')
                .setVisible(false)
                .setSize(mud.width, mud.height);
            
            (mudZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
            (mudZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            
            this.mudPuddles.push(mudZone);
            
            this.physics.add.overlap(
                this.player, 
                mudZone, 
                () => this.handleMudCollision(mudZone),
                undefined,
                this
            );
        });
    }

    private drawMudPuddle(x: number, y: number, width: number, height: number): void {
        const graphics = this.mudGraphics;
        
        graphics.fillStyle(0x4a3829, 0.7);
        
        graphics.fillEllipse(x, y, width, height);
        
        graphics.fillStyle(0x3a2819, 0.5);
        graphics.fillEllipse(x - width * 0.15, y + height * 0.1, width * 0.3, height * 0.25);
        graphics.fillEllipse(x + width * 0.1, y - height * 0.15, width * 0.25, height * 0.3);
        
        graphics.fillStyle(0x5a4839, 0.3);
        graphics.fillEllipse(x + width * 0.2, y + height * 0.2, width * 0.2, height * 0.15);
    }

    private handleMudCollision(mudZone: Phaser.Physics.Arcade.Sprite): void {
        if (!this.playerInMud && this.player && this.player.body) {
            this.playerInMud = true;
            
            const originalSpeed = (this.player as any).currentSpeed || 70;
            (this.player as any).currentSpeed = originalSpeed * this.mudSlowAmount;
            
            this.applyMudTilt();
            
            this.createMudSplash(this.player.x, this.player.y);
        }
    }

    private applyMudTilt(): void {
        if (!this.player) return;
        
        const tiltAngle = Phaser.Math.FloatBetween(-5, 5);
        
        this.tweens.add({
            targets: this.player,
            angle: tiltAngle,
            duration: 200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                if (this.player) {
                    this.player.setAngle(0);
                }
            }
        });
    }

    private createMudSplash(x: number, y: number): void {
        const splashGraphics = this.add.graphics();
        splashGraphics.setDepth(2);
        
        const particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = [];
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = Phaser.Math.FloatBetween(20, 40);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Phaser.Math.FloatBetween(2, 4)
            });
        }
        
        const splashDuration = 500;
        const startTime = this.time.now;
        
        const updateSplash = () => {
            const elapsed = this.time.now - startTime;
            const progress = elapsed / splashDuration;
            
            if (progress >= 1) {
                splashGraphics.destroy();
                return;
            }
            
            splashGraphics.clear();
            
            particles.forEach(particle => {
                particle.x += particle.vx * 0.016;
                particle.y += particle.vy * 0.016;
                particle.vy += 2;
                
                const alpha = 1 - progress;
                splashGraphics.fillStyle(0x4a3829, alpha * 0.8);
                splashGraphics.fillCircle(particle.x, particle.y, particle.size);
            });
            
            this.time.delayedCall(16, updateSplash);
        };
        
        updateSplash();
    }

    private checkPlayerOutOfMud(): void {
        if (!this.player || !this.player.body) {
            this.playerInMud = false;
            return;
        }
        
        let inMud = false;
        
        for (const mudZone of this.mudPuddles) {
            if (this.physics.overlap(this.player, mudZone)) {
                inMud = true;
                break;
            }
        }
        
        if (!inMud && this.playerInMud) {
            this.playerInMud = false;
            
            if ((this.player as any).getIsPoisoned && (this.player as any).getIsPoisoned()) {
                (this.player as any).currentSpeed = 70 * 0.5;
            } else if ((this.player as any).getIsCold && (this.player as any).getIsCold()) {
                (this.player as any).currentSpeed = 70 * 0.7;
            } else {
                (this.player as any).currentSpeed = 70;
            }
        }
    }

    private onLevelComplete(): void {
        this.isLevelCompleted = true;
        
        if (this.lightningTimer) {
            this.lightningTimer.destroy();
        }
        
        if (this.warningTimer) {
            this.warningTimer.destroy();
        }
        
        this.resetLightning();
        
        if (this.warningSound && this.warningSound.isPlaying) {
            this.warningSound.stop();
        }
        if (this.lightningStrike && this.lightningStrike.isPlaying) {
            this.lightningStrike.stop();
        }
        if (this.rain && this.rain.isPlaying) {
            this.rain.stop();
        }
    }

    private createRain(): void {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRect(0, 0, 2, 10); 
        gfx.generateTexture('raindrop', 2, 10);
        gfx.destroy();

        const particles = this.add.particles(0, 0, 'raindrop', {
            x: { min: 0, max: this.scale.width },
            y: 0,
            lifespan: 1200,
            speedY: { min: 500, max: 800 },
            scale: { min: 0.5, max: 1 },
            quantity: 4,
            alpha: { start: 1, end: 0 },
            angle: { min: 80, max: 100 }, 
            blendMode: 'NORMAL'
        });
        particles.setDepth(20);

        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.scale.width,
            this.scale.height,
            0x000033,
            0.3
        );
        overlay.setScrollFactor(0).setDepth(50);
    }

    private setupLightningSystem(): void {
        this.lightningWarning = this.add.graphics();
        this.lightningWarning.setDepth(15);
        this.lightningWarning.setVisible(false);

        this.lightningSprite = this.add.sprite(0, 0, 'lightning').setScale(.8);
        this.lightningSprite.setDepth(25);
        this.lightningSprite.setVisible(false);
        this.lightningSprite.setOrigin(0.5, 0);
    }

    private startLightningCycle(): void {
        this.lightningTimer = this.time.addEvent({
            delay: this.LIGHTNING_INTERVAL,
            callback: this.triggerLightningWarning,
            callbackScope: this,
            loop: true
        });

        this.time.delayedCall(3000, this.triggerLightningWarning, [], this);
    }

    private triggerLightningWarning(): void {
        if (this.isLevelCompleted || this.isLightningActive || !this.player || !this.player.active) {
            return;
        }

        this.isLightningActive = true;
        this.lightningDamageDealt = false;
        this.warningPosition.x = this.player.x;
        this.warningPosition.y = this.player.y;
        
        this.showWarningAtPosition(this.warningPosition.x, this.warningPosition.y);
        this.scene.get('Level4UI')?.events.emit('lightningWarning', this.WARNING_DURATION);
        this.warningTimer = this.time.addEvent({
            delay: this.WARNING_DURATION,
            callback: this.strikeLightning,
            callbackScope: this
        });
    }

    private showWarningAtPosition(x: number, y: number): void {
        this.lightningWarning.clear();
        this.lightningWarning.setVisible(true);

        const updateWarning = () => {
            if (!this.isLightningActive) {
                return;
            }

            this.lightningWarning.clear();
            this.lightningWarning.fillStyle(0xff0000, 0.3);
            this.lightningWarning.fillCircle(x, y, this.WARNING_RADIUS);
        };

        updateWarning();

        this.tweens.add({
            targets: this.lightningWarning,
            alpha: { from: 0.3, to: 0.7 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        const warningUpdateEvent = this.time.addEvent({
            delay: 16,
            callback: updateWarning,
            callbackScope: this,
            loop: true
        });

        this.time.delayedCall(this.WARNING_DURATION, () => {
            warningUpdateEvent.destroy();
        });

        this.warningSound.play();
    }

    private strikeLightning(): void {
        if (this.isLevelCompleted || !this.player || !this.player.active) {
            this.resetLightning();
            return;
        }

        this.lightningWarning.setVisible(false);
        this.tweens.killTweensOf(this.lightningWarning);

        const strikeX = this.warningPosition.x;
        const strikeY = this.warningPosition.y;

        this.lightningSprite.setPosition(strikeX, strikeY - 300);
        this.lightningSprite.setVisible(true);

        this.lightningSprite.play('strike');
        this.lightningStrike.play();
        this.scene.get('Level4UI')?.events.emit('lightningStrike');

        this.cameras.main.flash(200, 255, 255, 255, false);
        
        if (!this.lightningDamageDealt) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, 
                this.player.y, 
                strikeX, 
                strikeY
            );

            if (distance <= this.STRIKE_RADIUS) { 
                this.dealLightningDamage();
            }
        }

        this.lightningSprite.once('animationcomplete', () => {
            this.lightningSprite.setVisible(false);
            this.resetLightning();
        });
    }

    private dealLightningDamage(): void {
        if (this.lightningDamageDealt) {
            return;
        }

        this.lightningDamageDealt = true;
        
        if (this.player && typeof this.player.takeDamage === 'function') {
            for (let i = 0; i < this.LIGHTNING_DAMAGE; i++) {
                this.player.takeDamage();
            }
            
            const uiScene = this.scene.get('UIScene') as any;
            if (uiScene && uiScene.loseLife) {
                uiScene.loseLife(this.LIGHTNING_DAMAGE);
            }
        }
    }

    private resetLightning(): void {
        this.isLightningActive = false;
        this.lightningDamageDealt = false;
        this.lightningWarning.clear();
        this.lightningWarning.setVisible(false);
        this.tweens.killTweensOf(this.lightningWarning);
    }

    protected override cleanupLevelSpecific(): void {
        this.isLevelCompleted = false;

        if (this.lightningTimer) {
            this.lightningTimer.destroy();
        }
        
        if (this.warningTimer) {
            this.warningTimer.destroy();
        }

        this.tweens.killTweensOf(this.lightningWarning);
        this.resetLightning();
        
        this.mudPuddles.forEach(mud => mud.destroy());
        this.mudPuddles = [];
        
        if (this.mudGraphics) {
            this.mudGraphics.destroy();
        }
        
        this.playerInMud = false;
    }

    protected override cleanupBeforeExit(): void {
        this.isLevelCompleted = false;
        if (this.warningSound) {
            this.warningSound.stop();
            this.warningSound.destroy();
        }
        if (this.lightningStrike) {
            this.lightningStrike.stop();
            this.lightningStrike.destroy();
        }
        if (this.rain) {
            this.rain.stop();
            this.rain.destroy();
        }
        
        this.mudPuddles.forEach(mud => mud.destroy());
        this.mudPuddles = [];
        
        if (this.mudGraphics) {
            this.mudGraphics.destroy();
        }
        
        super.cleanupBeforeExit();
    }

    private setupSounds(): void {
        this.warningSound = addSceneSound(this, 'lightning_charge');
        this.lightningStrike = addSceneSound(this, 'lightning_strike');
        this.rain = addSceneSound(this, 'rain', {loop: true}).setVolume(.1);

        if (!this.rain.isPlaying) {
            this.rain.play();
        }
    }

    protected override updateLevelSpecific(time: number, delta: number): void {
        this.checkPlayerOutOfMud();
    }
}