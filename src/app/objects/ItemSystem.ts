import { Food } from "./Food";
import { Poison } from "./Poison";
import { Player } from "./Player";
import { GameMap } from "./GameMap";
import { ItemSpawnConfig } from "../interfaces/game.interfaces";
import { Battery } from "./Battery";

export class ItemSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private gameMap: GameMap;
    private foods: Food[] = [];
    private poisons: Poison[] = [];
    private batteries: any[] = [];
    private eatSound: Phaser.Sound.BaseSound;
    private poisonSound!: Phaser.Sound.BaseSound;
    private lvlComplete!: Phaser.Sound.BaseSound;

    private totalFoodCount: number = 0;
    
    constructor(scene: Phaser.Scene, player: Player, gameMap: GameMap) {
        this.scene = scene;
        this.player = player;
        this.gameMap = gameMap;
        
        this.eatSound = scene.sound.add('eat', { volume: 0.5 });
        this.poisonSound = scene.sound.add('slow', { volume: 1}); 
        this.lvlComplete = scene.sound.add('lvl-complete').setVolume(0.8);
    }

    public spawnItems(config: ItemSpawnConfig): void {
        this.clearAllItems();
        
        const foodTextures = ['food1', 'food2', 'food3', 'food4', 'food5'];
        const poisonTextures = ['poison1', 'poison2', 'poison3'];
        
        const occupiedPositions: { x: number, y: number }[] = [];

        occupiedPositions.push(config.playerSpawn);
        occupiedPositions.push(...config.dogSpawns);
        this.totalFoodCount = config.foodCount;

        for (let i = 0; i < config.foodCount; i++) {
            const position = this.findValidSpawnPosition(config, occupiedPositions);
            if (position) {
                const texture = Phaser.Utils.Array.GetRandom(foodTextures);
                const food = new Food(this.scene, position.x, position.y, texture);
                this.foods.push(food);
                occupiedPositions.push(position);
                this.scene.physics.add.overlap(this.player, food, (_, f) => this.collectFood(f as Food));
            }
        }

        for (let i = 0; i < config.poisonCount; i++) {
            const position = this.findValidSpawnPosition(config, occupiedPositions);
            if (position) {
                const texture = Phaser.Utils.Array.GetRandom(poisonTextures);
                const poison = new Poison(this.scene, position.x, position.y, texture);
                this.poisons.push(poison);
                occupiedPositions.push(position);

                this.scene.physics.add.overlap(this.player, poison, (_, p) => this.collectPoison(p as Poison));
            }
        }

        if (config.batteryCount && config.batteryCount > 0) {
            this.spawnBatteries(config, occupiedPositions);
        }
    }

    private spawnBatteries(config: ItemSpawnConfig, occupiedPositions: { x: number, y: number }[]): void {
        const batteryPositions = [
            { x: 400, y: 150 },
            { x: 600, y: 300 },
            { x: 250, y: 450 },
            { x: 700, y: 200 },
            { x: 350, y: 350 },
            { x: 550, y: 450 },
            { x: 800, y: 150 },
            { x: 150, y: 200 }
        ];
        const selectedPositions = Phaser.Utils.Array.Shuffle(batteryPositions).slice(0, config.batteryCount);

        selectedPositions.forEach(pos => {
            if (this.isValidSpawnPosition(pos.x, pos.y, config, occupiedPositions)) {
                // const batterySprite = this.scene.add.rectangle(pos.x, pos.y, 20, 30, 0xFFD700);
                const batterySprite = new Battery(this.scene, pos.x, pos.y, 'battery');
                batterySprite.setDepth(1);
                this.scene.physics.add.existing(batterySprite);
                
                this.scene.tweens.add({
                    targets: batterySprite,
                    alpha: 0.6,
                    scaleX: .4,
                    scaleY: .3,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                const batteryObject = {
                    sprite: batterySprite,
                    x: pos.x,
                    y: pos.y,
                    getChargeValue: () => 25,
                    destroy: () => {
                        if (batterySprite && batterySprite.scene) {
                            batterySprite.destroy();
                        }
                    }
                };
                
                this.batteries.push(batteryObject);
                occupiedPositions.push(pos);
                this.scene.physics.add.overlap(this.player, batterySprite, () => {
                    this.collectBattery(batteryObject);
                });
            }
        });
    }

    private collectBattery(battery: any): void {
        const chargeAmount = battery.getChargeValue();
    
        this.scene.events.emit('batteryCollected', chargeAmount);

        const index = this.batteries.indexOf(battery);
        if (index > -1) {
            this.batteries.splice(index, 1);
        }
        battery.destroy();
        this.scene.cameras.main.flash(200, 255, 255, 100);
    }

    private findValidSpawnPosition(config: ItemSpawnConfig, occupiedPositions: { x: number, y: number }[]): { x: number, y: number } | null {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Phaser.Math.Between(100, config.mapWidth - 100);
            const y = Phaser.Math.Between(100, config.mapHeight - 100);

            if (this.isValidSpawnPosition(x, y, config, occupiedPositions)) {
                return { x, y };
            }
            
            attempts++;
        }

        console.warn('Could not find valid spawn position after maximum attempts');
        return null;
    }

    private isValidSpawnPosition(x: number, y: number, config: ItemSpawnConfig, occupiedPositions: { x: number, y: number }[]): boolean {
        if (Phaser.Math.Distance.Between(config.playerSpawn.x, config.playerSpawn.y, x, y) < config.minPlayerDistance) {
            return false;
        }

        for (const dogSpawn of config.dogSpawns) {
            if (Phaser.Math.Distance.Between(dogSpawn.x, dogSpawn.y, x, y) < config.minPlayerDistance) {
                return false;
            }
        }

        for (const pos of occupiedPositions) {
            if (Phaser.Math.Distance.Between(pos.x, pos.y, x, y) < config.minItemDistance) {
                return false;
            }
        }

        if (this.isTooCloseToObstacles(x, y, config.minObstacleDistance)) {
            return false;
        }

        if (this.isTooCloseToBoxes(x, y, config.minBoxDistance)) {
            return false;
        }

        return true;
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
        this.eatSound.play();
        food.destroy();

        const collected = this.totalFoodCount - this.foods.length;
        this.scene.game.events.emit('foodCollected', collected, this.totalFoodCount);

        if(this.foods.length === 0) {
            this.lvlComplete.play();
            this.scene.game.events.emit('levelCompleted');
            alert('round completed!');
        }
    }

    private collectPoison(poison: Poison): void {
        Phaser.Utils.Array.Remove(this.poisons, poison);
        this.poisonSound.play();
        this.player.applyPoison();
        poison.destroy();
    }

    public clearAllItems(): void {
        this.foods.forEach(food => food.destroy());
        this.poisons.forEach(poison => poison.destroy());
        this.batteries.forEach(battery => {
            if (battery && battery.destroy) {
                battery.destroy();
            }
        });
        this.foods = [];
        this.poisons = [];
        this.batteries = [];
    }

    public getFoods(): Food[] {
        return this.foods;
    }

    public getPoisons(): Poison[] {
        return this.poisons;
    }

    public getBatteries(): any[] {
        return this.batteries;
    }

    public getRemainingFoodCount(): number {
        return this.foods.length;
    }

    public getTotalFoodCount(): number {
        return this.totalFoodCount;
    }

    public getCollectedFoodCount(): number {
        return this.totalFoodCount - this.foods.length;
    }

    public getRemainingPoisonCount(): number {
        return this.poisons.length;
    }

    public getRemainingBatteryCount(): number {
        return this.batteries.length;
    }

    public getAllItems(): (Food | Poison)[] {
        return [...this.foods, ...this.poisons];
    }
}