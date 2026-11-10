import Phaser from 'phaser';
import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
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

    protected override preloadLevelAssets(): void {
        this.load.image('snowman', 'assets/scene/levels/2/snowman.png');
        this.load.image('ice', 'assets/scene/levels/2/slippery.png');
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

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return { x: 200, y: 120 };
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return [
            { x: 420, y: 520, behavior: Dog.SLEEP },  
            { x: 750, y: 400, behavior: Dog.ROAM },  
            { x: 600, y: 150, behavior: Dog.SLEEP } 
        ];
    }

    protected override getLevelSpecificUIScenes(): string[] {
        return ['Level2UI'];
    }

    protected override createLevelSpecificElements(): void {
        this.resetFireMechanics();
        this.setupFireSounds();
        this.createSnowElements();
        this.setupFireMechanics();
        this.game.events.on('levelCompleted', () => {
            this.onLevelComplete();
        });
    }

    protected override createStaticElements(): void {
        this.createHouse(500, 520, false, 0.3);
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
        this.firewoodSound = this.sound.add('firewood', { volume: 0.8 });
        this.catBurnedSound = this.sound.add('cat_burned', { volume: 0.7 });
        this.burnedSound = this.sound.add('burned', { volume: 0.9 });
    }

    private createSnowElements(): void {
        this.add.sprite(0, 0, 'snow')
            .setOrigin(0)
            .play('blow')
            .setDepth(0);

        this.physics.add.staticImage(50, 80, 'snowman')
            .setOrigin(0)
            .setScale(0.8)
            .setDepth(0);

        this.physics.add.staticImage(880, 480, 'snowman')
            .setOrigin(0)
            .setFlipX(true)
            .setScale(0.8)
            .setDepth(0);

        this.fireSprite = this.add.sprite(500, 300, 'fire')
            .play('sway')
            .setScale(.12)
            .setDepth(2);
    }

    private setupFireMechanics(): void {
        this.fireProximityZone = this.physics.add.sprite(500, 300, '')
            .setSize(140, 140)
            .setVisible(false);
        (this.fireProximityZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);

        this.fireCollisionZone = this.physics.add.sprite(500, 300, '')
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
            fontFamily: 'Arial Black',
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

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: { x: 200, y: 120 },
            dogSpawn: { x: 350, y: 200 },
            manualObstacles: [
                { type: 'bushsnow', x: 100, y: 60, scale: 0.15 },
                { type: 'bushsnow', x: 400, y: 50, scale: 0.15 },
                { type: 'bushsnow', x: 700, y: 60, scale: 0.15 },
                { type: 'bushsnow', x: 900, y: 55, scale: 0.15 },

                { type: 'bushsnow', x: 80, y: 250, scale: 0.15 },
                { type: 'bushsnow', x: 100, y: 400, scale: 0.15 },

                { type: 'bushsnow', x: 380, y: 250, scale: 0.15 },
                { type: 'bushsnow', x: 620, y: 250, scale: 0.15 },
                { type: 'bushsnow', x: 450, y: 380, scale: 0.15 },
                { type: 'bushsnow', x: 550, y: 380, scale: 0.15 },
                
                { type: 'bushsnow', x: 850, y: 200, scale: 0.15 },
                { type: 'bushsnow', x: 900, y: 350, scale: 0.15 },

                { type: 'bushsnow', x: 250, y: 520, scale: 0.15 },
                { type: 'bushsnow', x: 700, y: 500, scale: 0.15 }
            ],
            randomObstacleZones: [],
            boxes: [
                { x: 150, y: 350 },   
                { x: 500, y: 180 },   
                { x: 780, y: 450 }, 
                { x: 700, y: 300 } 
            ],
            foodCount: 10,
            mapTexture: 'level2_map',
            backgroundMusic: 'level2_theme'
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        return {
            foodCount: 10,
            poisonCount: 6,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 60,
            minPlayerDistance: 120,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 200, y: 120 },
            dogSpawns: [
                { x: 350, y: 200 },
                { x: 750, y: 400 },
                { x: 600, y: 150 }
            ]
        };
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