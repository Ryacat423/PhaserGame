import { Player } from "../objects/Player";
import { Dog } from "../objects/Dog";
import { Food } from "../objects/Food";
import { GameMap } from "../objects/GameMap";
import { LevelConfig } from "../interfaces/game.interfaces";

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private dog!: Dog;

    private dog2!: Dog;;
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

        this.gameTheme = this.sound.add('game_theme');
        this.gameTheme.play();

        const background = this.add.image(0, 0, 'game_tutorial_map')
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 500, 300);
        this.add.existing(this.player);

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

        this.dog = new Dog(this, 300, 300, this.player);
        this.dog.setState(Dog.SLEEP);

        this.dog2 = new Dog(this, 500, 500, this.player);
        this.dog2.setState(Dog.ROAM);
        this.dog2.setTint(0xffcccc);

        this.add.existing(this.dog);
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
            foodCount: 10,
            mapTexture: 'game_tutorial_map',
            backgroundMusic: 'game_theme'
        };
        
        this.gameMap.setup(levelConfig);
        this.createFoodItems();

        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, background.width, background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);

        this.game.events.on('returnToWelcome', () => {
            this.cleanupBeforeExit();
            this.scene.stop('UIScene');
            this.dog.stopBark();
            this.scene.start('welcome');
        });
    }

    private cleanupBeforeExit() {
        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }

        this.tweens.getTweens().forEach(tween => tween.stop());

        if (this.dog) {
            this.dog.stopBark();
        }

        this.children.removeAll();
    }

    private createFoodItems(): void {
        const foodTextures = ['food1', 'food2', 'food3', 'food4', 'food5'];
        const foodCount = 10;

        for (let i = 0; i < foodCount; i++) {
            const texture = foodTextures[Phaser.Math.Between(0, foodTextures.length - 1)];
            let x, y;
            let attempts = 0;

            do {
                x = Phaser.Math.Between(100, this.scale.width - 100);
                y = Phaser.Math.Between(100, this.scale.height - 100);
                attempts++;
            } while (
                attempts < 50 && (
                    Math.sqrt((500 - x) ** 2 + (300 - y) ** 2) < 80 ||
                    Math.sqrt((300 - x) ** 2 + (300 - y) ** 2) < 80 ||
                    Math.sqrt((280 - x) ** 2 + (290 - y) ** 2) < 80 || 
                    this.isTooCloseToObstacles(x, y, 60)
                )
            );

            const food = new Food(this, x, y, texture);
            this.foods.push(food);

            this.physics.add.overlap(
                this.player,
                food,
                (player, food) => this.collectFood(food as Food),
                undefined,
                this
            );
        }
    }

    private isTooCloseToObstacles(x: number, y: number, minDistance: number): boolean {
        return this.gameMap.getObstacles().some(obstacle =>
            Math.sqrt((obstacle.x - x) ** 2 + (obstacle.y - y) ** 2) < minDistance
        );
    }

    private collectFood(food: Food): void {
        const index = this.foods.indexOf(food);
        if (index !== -1) {
            this.foods.splice(index, 1);
        }

        food.destroy();
    }

    override update(time: number, delta: number): void {
        this.player.update();
        this.dog.update(time, delta);
        this.dog2.update(time, delta);
    }
}