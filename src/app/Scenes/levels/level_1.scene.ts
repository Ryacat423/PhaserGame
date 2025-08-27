import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog } from "../../objects/Dog";
import { GameMap } from "../../objects/GameMap";
import { ItemSystem } from "../../objects/ItemSystem";
import { Player } from "../../objects/Player";

export class Level1Scene extends Phaser.Scene {
    private player!: Player;
    private dogs: Dog[] = [];
    private gameMap!: GameMap;
    private itemSystem!: ItemSystem;
    private gameTheme!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'level1' });
    }

    preload(): void {
        this.load.image('level1_map', 'assets/scene/levels/1/map.png');
        this.load.audio('level1_theme', 'assets/global/audio/gameplay.ogg');
    }

    create(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('level1_theme', { loop: true }).setVolume(0.8);
        this.gameTheme.play({loop: true});

        const background = this.add.image(0, 0, 'level1_map')
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
        
        this.player = new Player(this, 300, 100);
        this.add.existing(this.player);
            
        house.body?.setAllowGravity(false);
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
            this.physics.add.collider(this.player, dog, () => dog.onCollideWithPlayer());
        });

        this.gameMap = new GameMap(this, this.player);

        const levelConfig: LevelConfig = {
            playerSpawn: { x: 100, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [
                { type: 'tree', x: 300, y: 150, scale: 0.2 },
                { type: 'tree', x: 500, y: 250, scale: 0.15 },
                { type: 'tree', x: 700, y: 150, scale: 0.20 },
                { type: 'tree', x: 200, y: 400, scale: 0.21 },
                { type: 'tree', x: 600, y: 500, scale: 0.19 },
                { type: 'tree', x: 450, y: 350, scale: 0.14 },
            ],
            randomObstacleZones: [
                { zone: { x: 0, y: 0, width: background.width, height: 100 }, type: 'tree', count: 8, minDistance: 60 },
                { zone: { x: 0, y: background.height - 100, width: background.width, height: 100 }, type: 'tree', count: 8, minDistance: 60 },
                { zone: { x: 0, y: 100, width: 80, height: background.height - 200 }, type: 'tree', count: 5, minDistance: 60 },
                { zone: { x: background.width - 80, y: 100, width: 80, height: background.height - 200 }, type: 'tree', count: 5, minDistance: 60 },
                { zone: { x: 300, y: 200, width: 200, height: 200 }, type: 'tree', count: 3, minDistance: 80 }
            ],
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: 12, 
            mapTexture: 'level1_map',
            backgroundMusic: 'level1_theme'
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
            mapWidth: background.width,
            mapHeight: background.height,
            playerSpawn: { x: 100, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 400, y: 500 }
            ]
        };
        
        this.itemSystem.spawnItems(itemConfig)
        this.setupBoxEventListeners();

        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, background.width, background.height);
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
            dog.stopBark();
        });
        
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
    }

    private cleanupBeforeExit(): void {
        if (this.gameTheme?.isPlaying) {
            this.gameTheme.stop();
        }
        if (this.gameTheme) {
            this.gameTheme.destroy();
        }
        
        this.dogs.forEach(dog => {
            dog.stopBark();
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
        
        this.children.removeAll();
        this.sound.stopAll();
    }

    public getDogs(): Dog[] {
        return this.dogs;
    }
    
    public destroyDogs(): void {
        this.dogs.forEach(dog => dog.destroy());
        this.dogs = [];
    }

    public getItemSystem(): ItemSystem {
        return this.itemSystem;
    }

    override update(time: number, delta: number): void {
        this.player.update(time, delta);
        this.dogs.forEach(dog => dog.update(time, delta));
        this.gameMap.update();
    }
}