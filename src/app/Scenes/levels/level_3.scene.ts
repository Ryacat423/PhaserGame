import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class Level3Scene extends BaseLevel {
    private ambience!: Phaser.Sound.BaseSound;
    private owlHoot!: Phaser.Sound.BaseSound;
    
    private darkness!: Phaser.GameObjects.Graphics;
    private lightMask!: Phaser.GameObjects.Graphics;
    private flashlightRadius: number = 100;
    
    private batteryDrainTimer!: Phaser.Time.TimerEvent;
    private currentBattery: number = 80;
    private maxBattery: number = 100;
    private batteryDrainRate: number = 3;

    constructor() {
        super('level3');
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('night-ambience', 'assets/global/audio/night-ambience.mp3');
        this.load.audio('owl-hoot', 'assets/global/audio/owl-hoot.mp3');
    }

    protected getThemeAudioKey(): string {
        return 'level3_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/night-theme.mp3';
    }

    protected override getThemeVolume(): number {
        return 0.2;
    }

    protected getBackgroundTextureKey(): string {
        return 'level3_map';
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

    protected override getLevelSpecificUIScenes(): string[] {
        return ['Level3UI'];
    }

    protected override createLevelSpecificElements(): void {
        this.setupNightAmbience();
        this.createFlashlightSystem();
        this.setupBatterySystem();
        this.setupBatteryEventListeners();
    }

    private setupNightAmbience(): void {
        this.ambience = this.sound.add('night-ambience', { loop: true, volume: 1 });
        this.owlHoot = this.sound.add('owl-hoot', { loop: true, volume: 1 });
        
        this.ambience.play();
        this.time.addEvent({
            delay: 5000,
            callback: () => {
                this.owlHoot.play();
            },
            loop: true
        });
    }

    private createFlashlightSystem(): void {
        const width = this.background.width;
        const height = this.background.height;

        this.lightMask = this.add.graphics();
        
        this.darkness = this.add.graphics();
        this.darkness.fillStyle(0x000000, 1);
        this.darkness.fillRect(0, 0, width, height);
        this.darkness.setDepth(20);

        const mask = this.lightMask.createGeometryMask();
        mask.invertAlpha = true;
        this.darkness.setMask(mask);

        this.updateFlashlightMask();
    }

    private setupBatterySystem(): void {
        this.batteryDrainTimer = this.time.addEvent({
            delay: 2000,
            callback: this.drainBattery,
            callbackScope: this,
            loop: true
        });

        this.updateBatteryUI();
    }

    private setupBatteryEventListeners(): void {
        this.events.on('batteryCollected', (chargeAmount: number) => {
            this.currentBattery = Math.min(this.maxBattery, this.currentBattery + chargeAmount);
            this.updateBatteryUI();
            this.updateFlashlightRadius();
            
            const level3UI = this.scene.get('Level3UI');
            if (level3UI && level3UI.scene.isActive()) {
                level3UI.events.emit('batteryCollected', chargeAmount);
            }
        });
    }

    private drainBattery(): void {
        if (this.currentBattery > 0) {
            this.currentBattery = Math.max(0, this.currentBattery - this.batteryDrainRate);
            this.updateBatteryUI();
            this.updateFlashlightRadius();
        }
    }

    private updateBatteryUI(): void {
        const level3UI = this.scene.get('Level3UI');
        if (level3UI && level3UI.scene.isActive()) {
            level3UI.events.emit('batteryLevelChanged', {
                current: this.currentBattery,
                max: this.maxBattery
            });
        }
    }

    private updateFlashlightRadius(): void {
        const batteryPercentage = this.currentBattery / this.maxBattery;
        
        if (batteryPercentage <= 0) {
            this.flashlightRadius = 0;
        } else if (batteryPercentage <= 0.1) {
            this.flashlightRadius = 30;
        } else if (batteryPercentage <= 0.3) {
            this.flashlightRadius = 60;
        } else {
            this.flashlightRadius = 100;
        }
    }

    private updateFlashlightMask(): void {
        if (!this.lightMask || !this.player) return;
        
        this.lightMask.clear();
        
        const playerX = this.player.x;
        const playerY = this.player.y;
        const radius = this.flashlightRadius;
        
        if (this.currentBattery > 0) {
            let alpha = 0.09;
            if (this.currentBattery <= 10) {
                alpha = Phaser.Math.FloatBetween(0.05, 0.15);
            }

            this.lightMask.fillStyle(0xffffff, alpha);
            this.lightMask.fillCircle(playerX, playerY, radius * 0.95);

            this.lightMask.fillStyle(0xffffff, 0.2);
            this.lightMask.fillCircle(playerX, playerY, radius);
        }
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: { x: 300, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [
                { type: 'tree', x: 300, y: 150, scale: 0.2 }
            ],
            randomObstacleZones: [
                { 
                    zone: { x: 300, y: 200, width: 200, height: 200 }, 
                    type: 'tree', 
                    count: 3, 
                    minDistance: 80 
                }
            ],
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: 12,
            mapTexture: 'level3_map',
            backgroundMusic: 'level3_theme'
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        return {
            foodCount: 10,
            poisonCount: 6,
            batteryCount: 10,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 300, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 500, y: 500 }
            ]
        };
    }

    protected override cleanupLevelSpecific(): void {
        if (this.batteryDrainTimer) {
            this.batteryDrainTimer.destroy();
        }
        this.currentBattery = 80;
        this.flashlightRadius = 100;

        if (this.lightMask) {
            this.lightMask.destroy();
        }
        if (this.darkness) {
            this.darkness.destroy();
        }
    }

    protected override cleanupBeforeExit(): void {
        super.cleanupBeforeExit();

        if (this.ambience) {
            this.ambience.stop();
            this.ambience.destroy();
        }
        if (this.owlHoot) {
            this.owlHoot.stop();
            this.owlHoot.destroy();
        }
    }

    protected override updateLevelSpecific(time: number, delta: number): void {
        this.updateFlashlightMask();
        // if (this.currentBattery <= 0) {
        //     this.handleBatteryDrained();
        // }
    }

    public getCurrentBattery(): number {
        return this.currentBattery;
    }

    public getMaxBattery(): number {
        return this.maxBattery;
    }

    // private handleBatteryDrained(): void {
    //     if (this.batteryDrainTimer) {
    //         this.batteryDrainTimer.destroy();
    //     }
    //     // Handle battery drained game over logic here
    // }
}