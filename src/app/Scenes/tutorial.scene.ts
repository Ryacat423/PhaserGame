import { Player } from "../objects/Player";
import { Dog } from "../objects/Dog";
import { GameMap } from "../objects/GameMap";
import { ItemSystem } from "../objects/ItemSystem";

import { ItemSpawnConfig, LevelConfig } from "../interfaces/game.interfaces";

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private dogs: Dog[] = [];
    private gameMap!: GameMap;
    private itemSystem!: ItemSystem;
    private gameTheme!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'tutorial' });
    }

    preload(): void {
        this.load.image('game_tutorial_map', 'assets/scene/tutorial/tutorial_map.png');
    }

    create(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('game_theme', { loop: true }).setVolume(0.2);
        this.gameTheme.play();

        const background = this.add.image(0, 0, 'game_tutorial_map')
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 500, 300);
        this.add.existing(this.player);
        
        // Dog house
        const house = this.physics.add
            .image(280, 290, 'dog_house')
            .setDepth(0)
            .setFlipX(true)
            .setScale(0.3)
            .setImmovable(true)
            .setSize(200, 190)
            .setOffset(120, 120);
        house.body?.setAllowGravity(false);
        this.physics.add.collider(this.player, house);
        
        const dog1 = new Dog(this, 300, 300, this.player, Dog.SLEEP);
        const dog2 = new Dog(this, 500, 500, this.player, Dog.ROAM);
        dog2.setTint(0xffcccc);

        this.add.existing(dog1);
        this.add.existing(dog2);

        this.physics.add.collider(dog1, dog2);
        this.dogs.push(dog1, dog2);
        this.dogs.forEach(dog => {
            this.physics.add.collider(dog, house);
            this.physics.add.collider(this.player, dog, () => dog.onCollideWithPlayer());
        });

        this.gameMap = new GameMap(this, this.player);

        const levelConfig: LevelConfig = {
            playerSpawn: { x: 500, y: 300 },
            dogSpawn: { x: 300, y: 300 },
            manualObstacles: [
                { type: 'tree', x: 150, y: 150, scale: 0.25 },
                { type: 'tree', x: 700, y: 200, scale: 0.3 },
                { type: 'tree', x: 400, y: 500, scale: 0.28 },
            ],
            randomObstacleZones: [
                { zone: { x: 0, y: 0, width: background.width, height: 120 }, type: 'tree', count: 6, minDistance: 80 },
                { zone: { x: 0, y: background.height - 120, width: background.width, height: 120 }, type: 'tree', count: 6, minDistance: 80 },
                { zone: { x: 0, y: 120, width: 100, height: background.height - 240 }, type: 'tree', count: 4, minDistance: 70 },
                { zone: { x: background.width - 100, y: 120, width: 100, height: background.height - 240 }, type: 'tree', count: 4, minDistance: 70 }
            ],
            boxes: [
                { x: 600, y: 400 },
                { x: 350, y: 450 },
                { x: 750, y: 300 }
            ],
            foodCount: 10,
            mapTexture: 'game_tutorial_map',
            backgroundMusic: 'game_theme'
        };

        this.gameMap.setup(levelConfig);
        this.gameMap.setupDogColliders(this.dogs);

        this.itemSystem = new ItemSystem(this, this.player, this.gameMap);
        
        const itemConfig: ItemSpawnConfig = {
            foodCount: 8,
            poisonCount: 4,
            minItemDistance: 60,
            minObstacleDistance: 50,
            minBoxDistance: 70,
            minPlayerDistance: 80,
            mapWidth: background.width,
            mapHeight: background.height,
            playerSpawn: { x: 500, y: 300 },
            dogSpawns: [
                { x: 300, y: 300 },
                { x: 500, y: 500 }
            ]
        };
        
        this.itemSystem.spawnItems(itemConfig);
        this.setupBoxEventListeners();

        // Camera
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
    }

    private setupBoxEventListeners(): void {
        this.events.on('playerNearBox', (isNear: boolean) => {
            const uiScene = this.scene.get('UIScene');
            uiScene.events.emit('playerNearBox', isNear);
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