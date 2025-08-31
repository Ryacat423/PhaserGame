import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog } from "../../objects/Dog";
import { GameMap } from "../../objects/GameMap";
import { ItemSystem } from "../../objects/ItemSystem";
import { Player } from "../../objects/Player";

export class Level3Scene extends Phaser.Scene {
    private player!: Player;
    private dogs: Dog[] = [];
    private gameMap!: GameMap;
    private itemSystem!: ItemSystem;
    private gameTheme!: Phaser.Sound.BaseSound;

    private darkness!: Phaser.GameObjects.Graphics;
    private lightMask!: Phaser.GameObjects.Graphics;

    private flashlightRadius: number = 100;
    private background!: Phaser.GameObjects.Image;
    
    private batteryDrainTimer!: Phaser.Time.TimerEvent;
    private currentBattery: number = 80;
    private maxBattery: number = 100;
    private batteryDrainRate: number = 1;

    constructor() {
        super({ key: 'level3' });
    }

    preload(): void {
        this.load.image('level3_map', 'assets/scene/levels/3/map.png');
        this.load.audio('level3_theme', 'assets/global/audio/night-theme.mp3');
    }

    create(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }
        if (!this.scene.isActive('Level3UI')) {
            this.scene.launch('Level3UI');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('level3_theme', { loop: true, volume: 0.5 });
        this.gameTheme.play();

        this.background = this.add.image(0, 0, 'level3_map')
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 300, 100);
        this.add.existing(this.player);

        const dog1 = new Dog(this, 200, 200, this.player, Dog.SLEEP);
        const dog2 = new Dog(this, 800, 400, this.player, Dog.ROAM);
        const dog3 = new Dog(this, 500, 500, this.player, Dog.SLEEP); 

        this.add.existing(dog1);
        this.add.existing(dog2);
        this.add.existing(dog3);
        this.physics.add.collider(dog1, dog2);
        this.physics.add.collider(dog1, dog3);
        this.physics.add.collider(dog2, dog3);
        
        this.dogs.push(dog1, dog2, dog3);
        this.dogs.forEach(dog => {
            this.physics.add.collider(this.player, dog, () => {
                dog.onCollideWithPlayer();
            });
        });

        this.gameMap = new GameMap(this, this.player);

        this.createFlashlightSystem(this.background.width, this.background.height);

        const levelConfig: LevelConfig = {
            playerSpawn: { x: 300, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [
                { type: 'tree', x: 300, y: 150, scale: 0.2 },
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

        this.gameMap.setup(levelConfig);
        this.gameMap.setupDogColliders(this.dogs);
        this.itemSystem = new ItemSystem(this, this.player, this.gameMap);
        
        const itemConfig: ItemSpawnConfig = {
            foodCount: 10,
            poisonCount: 6,
            batteryCount: 5,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: this.background.width,
            mapHeight: this.background.height,
            playerSpawn: { x: 300, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 500, y: 500 }
            ]
        };
        
        this.itemSystem.spawnItems(itemConfig);
        this.setupBatterySystem();
        this.setupBatteryEventListeners();

        this.setupBoxEventListeners();
        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, this.background.width, this.background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);

        this.events.on('beforeSceneRestart', () => {
            this.cleanupBeforeRestart();
        });

        this.game.events.on('returnToWelcome', () => {
            this.cleanupBeforeExit();
            this.scene.stop('Level3UI');
            this.scene.stop('UIScene');
            this.scene.start('welcome');
        });
        
        this.events.once('shutdown', () => {
            this.cleanupBeforeExit();
        });

        this.notifyUISceneStarted();
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

    private createFlashlightSystem(width: number, height: number): void {
        this.lightMask = this.add.graphics();
    
        this.darkness = this.add.graphics();
        this.darkness.fillStyle(0x000000, .9);
        this.darkness.fillRect(0, 0, width, height);
        this.darkness.setDepth(20); 

        const mask = this.lightMask.createGeometryMask();
        mask.invertAlpha = true;
        this.darkness.setMask(mask);

        this.updateFlashlightMask();
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

    private notifyUISceneStarted(): void {
        const level3UI = this.scene.get('Level3UI');
        if (level3UI && level3UI.scene.isActive()) {
            level3UI.events.emit('sceneStarted');
        }
        this.game.events.emit('levelStarted');
    }

    private setupBoxEventListeners(): void {
        this.events.on('playerNearBox', (isNear: boolean) => {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.events.emit('playerNearBox', isNear);
            }
        });
        
        this.events.on('hideButtonPressed', () => {
            this.handleHideAction();
        });
    }

    private handleHideAction(): void {
        const nearbyBox = this.gameMap.getBoxes().find(box => box.getIsPlayerNearby());
        if (nearbyBox && nearbyBox.getIsPlayerHiding()) {
            nearbyBox.forceStopHiding();
        }
    }

    private cleanupBeforeRestart(): void {
        if (this.batteryDrainTimer) {
            this.batteryDrainTimer.destroy();
        }
        this.currentBattery = 80;
        this.flashlightRadius = 100;

        if (this.gameMap && this.gameMap.getBoxes) {
            this.gameMap.getBoxes().forEach(box => {
                if (box && typeof box.forceStopHiding === 'function') {
                    box.forceStopHiding();
                }
            });
        }

        this.dogs.forEach(dog => {
            if (dog && typeof dog.stopBark === 'function') {
                dog.stopBark();
            }
        });
        
        if (this.itemSystem && typeof this.itemSystem.clearAllItems === 'function') {
            this.itemSystem.clearAllItems();
        }
    }

    private cleanupBeforeExit(): void {
        if (this.batteryDrainTimer) {
            this.batteryDrainTimer.destroy();
        }

        if (this.gameTheme) {
            if (this.gameTheme.isPlaying) {
                this.gameTheme.stop();
            }
            this.gameTheme.destroy();
        }
        
        this.dogs.forEach(dog => {
            if (typeof dog.stopBark === 'function') {
                dog.stopBark();
            }
        });
        this.tweens.getTweens().forEach(tween => tween.stop());
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
        this.gameMap.getBoxes().forEach(box => {
            if (typeof box.forceStopHiding === 'function') {
                box.forceStopHiding();
            }
        });
        if (this.lightMask) {
            this.lightMask.destroy();
        }
        this.children.removeAll();
        this.sound.stopAll();
    }

    public getDogs(): Dog[] {
        return this.dogs;
    }
    
    public destroyDogs(): void {
        this.dogs.forEach(dog => {
                dog.destroy();
        });
        this.dogs = [];
    }

    public getItemSystem(): ItemSystem {
        return this.itemSystem;
    }

    public getPlayer(): Player {
        return this.player;
    }

    public getCurrentBattery(): number {
        return this.currentBattery;
    }

    public getMaxBattery(): number {
        return this.maxBattery;
    }

    override update(time: number, delta: number): void {
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }

        this.dogs.forEach(dog => {
            if (dog && dog.active) {
                dog.update(time, delta);
            }
        });

        if (this.gameMap) {
            this.gameMap.update();
        }

        this.updateFlashlightMask();
        if (this.currentBattery <= 0) {
            this.handleBatteryDrained();
        }
    }

    private handleBatteryDrained(): void {
        if (this.batteryDrainTimer) {
            this.batteryDrainTimer.destroy();
        }
        this.cleanupBeforeRestart();
        this.time.delayedCall(1000, () => {
            this.scene.restart();
        });
    }
}