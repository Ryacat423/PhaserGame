import { Player } from "../objects/Player";
import { Dog } from "../objects/Dog";
import { Food } from "../objects/Food";
import { GameMap } from "../objects/GameMap";
import { LevelConfig } from "../interfaces/game.interfaces";

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private dogs: Dog[] = [];
    private foods: Food[] = [];
    private gameMap!: GameMap;
    private gameTheme!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'tutorial' });
    }

    preload(): void {
        this.load.image('game_tutorial_map', 'assets/scene/tutorial/tutorial_map.png');
        this.load.audio('game_theme', 'assets/global/audio/gameplay.ogg');
    }

    create(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('game_theme', { loop: true });
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

        this.dogs.push(dog1, dog2);
        this.dogs.forEach(dog => {
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

        // Food
        this.createFoodItems();

        // UI event hooks
        this.setupBoxEventListeners();

        // Camera
        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, background.width, background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);

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
        this.gameMap.getBoxes().forEach(box => box.forceStopHiding());
        this.children.removeAll();
        this.sound.stopAll();
    }

    private createFoodItems(): void {
        const foodTextures = ['food1', 'food2', 'food3', 'food4', 'food5'];
        const foodCount = 10;

        for (let i = 0; i < foodCount; i++) {
            const texture = Phaser.Utils.Array.GetRandom(foodTextures);
            let x, y, attempts = 0;

            do {
                x = Phaser.Math.Between(100, this.scale.width - 100);
                y = Phaser.Math.Between(100, this.scale.height - 100);
                attempts++;
            } while (
                attempts < 50 && (
                    Phaser.Math.Distance.Between(500, 300, x, y) < 80 ||
                    Phaser.Math.Distance.Between(300, 300, x, y) < 80 ||
                    Phaser.Math.Distance.Between(280, 290, x, y) < 80 || 
                    this.isTooCloseToObstacles(x, y, 60) ||
                    this.isTooCloseToBoxes(x, y, 80)
                )
            );

            const food = new Food(this, x, y, texture);
            this.foods.push(food);

            this.physics.add.overlap(this.player, food, (_, f) => this.collectFood(f as Food));
        }
    }

    private isTooCloseToObstacles(x: number, y: number, minDistance: number): boolean {
        return this.gameMap.getObstacles().some(obstacle =>
            Phaser.Math.Distance.Between(obstacle.x, obstacle.y, x, y) < minDistance
        );
    }

    private isTooCloseToBoxes(x: number, y: number, minDistance: number): boolean {
        return this.gameMap.getBoxes().some(box =>
            Phaser.Math.Distance.Between(box.x, box.y, x, y) < minDistance
        );
    }

    private collectFood(food: Food): void {
        Phaser.Utils.Array.Remove(this.foods, food);
        food.destroy();
    }

    override update(time: number, delta: number): void {
        this.player.update();
        this.dogs.forEach(dog => dog.update(time, delta));
        this.gameMap.update();
    }
}