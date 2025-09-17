import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { DogState, Dog } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class Level4Scene extends BaseLevel {
    private lightningWarning!: Phaser.GameObjects.Graphics;
    private lightningSprite!: Phaser.GameObjects.Sprite;
    private lightningTimer!: Phaser.Time.TimerEvent;
    private warningTimer!: Phaser.Time.TimerEvent;
    private isLightningActive: boolean = false;
    private lightningDamageDealt: boolean = false;
    private readonly LIGHTNING_DAMAGE = 3;
    private readonly WARNING_DURATION = 2000;
    private readonly LIGHTNING_INTERVAL = 8000; 
    private readonly WARNING_RADIUS = 60;
    private readonly STRIKE_RADIUS = 50;
    
    private warningSound!: Phaser.Sound.BaseSound;
    private lightningStrike!: Phaser.Sound.BaseSound;
    private rain!: Phaser.Sound.BaseSound;

    private warningPosition: { x: number, y: number } = { x: 0, y: 0 };

    constructor() {
        super('level4');
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('level4_theme', 'assets/global/audio/rain_theme.mp3');
        this.load.audio('rain', 'assets/global/audio/rain.wav');
        this.load.audio('lightning_charge', 'assets/global/audio/lightning_start.mp3');
        this.load.audio('lightning_strike', 'assets/global/audio/lightning_strike.mp3');
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

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return { x: 300, y: 100 };
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return [
            { x: 200, y: 200, behavior: Dog.SLEEP },
            { x: 800, y: 400, behavior: Dog.ROAM },
            { x: 500, y: 500, behavior: Dog.SLEEP }
        ];
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: { x: 100, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [],
            randomObstacleZones: [
                { zone: { x: 0, y: backgroundHeight - 100, width: backgroundWidth, height: 100 }, type: 'bush', count: 8, minDistance: 60 },
            ],
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: 12,
            mapTexture: 'level13_map',
            backgroundMusic: 'level4_theme'
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        return {
            foodCount: 10,
            poisonCount: 6,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 100, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 400, y: 500 }
            ]
        };
    }

    protected override createLevelSpecificElements(): void {
        this.preloadLevelAssets();
        this.setupSounds();
        this.createRain();
        this.setupLightningSystem();
        this.startLightningCycle();
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
        if (this.isLightningActive || !this.player || !this.player.active) {
            return;
        }

        this.isLightningActive = true;
        this.lightningDamageDealt = false;
        this.warningPosition.x = this.player.x;
        this.warningPosition.y = this.player.y;
        
        this.showWarningAtPosition(this.warningPosition.x, this.warningPosition.y);
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
        if (!this.player || !this.player.active) {
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

        this.cameras.main.flash(200, 255, 255, 255, false);
        if (!this.lightningDamageDealt) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, 
                this.player.y, 
                strikeX, 
                strikeY
            );

            console.log('Lightning strike at:', strikeX, strikeY);
            console.log('Player at:', this.player.x, this.player.y);
            console.log('Distance:', distance, 'Strike radius:', this.STRIKE_RADIUS);

            if (distance <= this.STRIKE_RADIUS) { 
                console.log('Player hit by lightning!');
                this.dealLightningDamage();
            } else {
                console.log('Player escaped the lightning!');
            }
        }

        this.lightningSprite.once('animationcomplete', () => {
            this.lightningSprite.setVisible(false);
            this.resetLightning();
        });
    }

    private dealLightningDamage(): void {
        if (this.lightningDamageDealt) {
            console.log('Lightning damage already dealt, skipping...');
            return;
        }

        this.lightningDamageDealt = true;
        console.log('Dealing lightning damage:', this.LIGHTNING_DAMAGE);
        
        if (this.player && typeof this.player.takeDamage === 'function') {
            for (let i = 0; i < this.LIGHTNING_DAMAGE; i++) {
                this.player.takeDamage();
            }
            
            const uiScene = this.scene.get('UIScene') as any;
            if (uiScene && uiScene.loseLife) {
                console.log('Calling UI loseLife directly with damage:', this.LIGHTNING_DAMAGE);
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
        if (this.lightningTimer) {
            this.lightningTimer.destroy();
        }
        
        if (this.warningTimer) {
            this.warningTimer.destroy();
        }

        this.tweens.killTweensOf(this.lightningWarning);
        this.resetLightning();
    }

    private setupSounds(): void {
        this.warningSound = this.sound.add('lightning_charge');
        this.lightningStrike = this.sound.add('lightning_strike');
        this.rain = this.sound.add('rain', {loop: true}).setVolume(.1);

        if (!this.rain.isPlaying) {
            this.rain.play();
        }
    }
}