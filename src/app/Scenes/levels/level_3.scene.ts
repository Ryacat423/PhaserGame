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

    constructor() {
        super({ key: 'level3' });
    }

    preload(): void {
        this.load.image('level3_map', 'assets/scene/levels/3/map.png');
        this.load.audio('level3_theme', 'assets/global/audio/night-theme.mp3');
        
        if (!this.textures.exists('dog_house')) {
            this.load.image('dog_house', 'assets/objects/dog_house.png');
        }
    }

    create(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('level3_theme', { loop: true, volume: 0.8 });
        this.gameTheme.play();

        this.background = this.add.image(0, 0, 'level3_map')
            .setOrigin(0)
            .setDepth(0);

        const house = this.physics.add
            .image(180, 200, 'dog_house')
            .setDepth(0)
            .setFlipX(true)
            .setScale(0.3)
            .setImmovable(true)
            .setSize(200, 190)
            .setOffset(120, 120);
        
        if (house.body) {
            house.body.setAllowGravity(false);
        }
        
        this.player = new Player(this, 300, 100);
        this.add.existing(this.player);
    
        this.physics.add.collider(this.player, house);

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
            this.scene.stop('UIScene');
            this.scene.start('welcome');
        });
        
        this.events.once('shutdown', () => {
            this.cleanupBeforeExit();
        });

        this.notifyUISceneStarted();
    }

    private createFlashlightSystem(width: number, height: number): void {
        this.lightMask = this.add.graphics();
    
        this.darkness = this.add.graphics();
        this.darkness.fillStyle(0x000000, 0.9);
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

        this.lightMask.fillStyle(0xffffff, 0.1);
        this.lightMask.fillCircle(playerX, playerY, radius * 0.95);

        this.lightMask.fillStyle(0xffffff, 0.2);
        this.lightMask.fillCircle(playerX, playerY, radius);
    }

    private notifyUISceneStarted(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
            uiScene.events.emit('sceneStarted');
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
        this.gameMap.getBoxes().forEach(box => {
            if (typeof box.forceStopHiding === 'function') {
                box.forceStopHiding();
            }
        });

        this.dogs.forEach(dog => {
            if (typeof dog.stopBark === 'function') {
                dog.stopBark();
            }
        });
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
    }

    private cleanupBeforeExit(): void {
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
    }
}